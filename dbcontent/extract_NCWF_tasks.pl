############################################
# This script is designed to extract "standardLO" information
#   from the NIST document describing NCWF. It puts it into a
#   tabular format so that a Node script can easily read and
#   insert items into the database.
#
# Before you can run this file, you need to
#   1) get the document:
#       http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-181.pdf
#   2) convert it into a text file:
#       a - install "ghostscript", if you don't already have it (try "which gs")
#       b - run this command from the directory with the pdf:
#               "gs -sDEVICE=txtwrite -o NIST.SP.800-181.txt NIST.SP.800-181.pdf"
#           NOTE: there are certainly other ways to convert pdf -> txt,
#                   but this script was designed around the file produced
#                   by the above command, using Ghostscript 9.18
#                   If a newer version does different things...good luck.
#                 If you elect to use a different conversion,
#                   you'll need to adapt this script to the new formatting.
#   3) move the new .txt file to LO Suggestion's 'dbcontent/rawdata' directory
#   4) there are unfortunately numerous other problems that we
#       need to fix, but we'll run the script first to know where
# To actually run the file, run
#       "perl dbcontent/extract_NCWF_tasks.pl" from the LO Suggestion root directory
#   It'll do most of the work, but it'll also note that it's missing
#       some entries. That's because the extraction process depends
#       on the descriptions ending with a period, and not all of them
#       do. We'll have to fix that manually, but thanks to the warning
#       messages, we know which ones to fix.
#   NOTE: There are in fact a lot of codes that just don't exist.
#   NOTE: Some of the tasks span a page break, and therefore accrue...extra
#       words. You should delete those page breaks from the framework file.
#   NOTE: Some of the tasks may have been withdrawn. Delete them.
#   NOTE: There is one task (T0021) whose description completes before the
#       code appears. That breaks things, so put them on the same line.

# PARAMETERS
my $fmwk = "dbcontent/rawdata/NIST.SP.800-181.txt";     # input file
my $dat = "dbcontent/NIST.SP.800-181.tasks.dat";        # output file
# length of margin and code for desired section:    K  S  A1 A2
my $margin = 10;                                #   10 11 10 13
my $column = 6;                                 #   6  6  6  7


# PROGRAM
use strict;
use warnings;

# load files
open NCWF, '<', $fmwk or die "Could not find textified framework file. $!";
open TABLE, '>', $dat or die "Could not open file to write data to: $!";

my $code;
my $description;

################################
# Assumptions:
# - codes are Txxxx, starting in second column (from character 10)
# - descriptions are entirely in 3rd column (from character 16),
#   start with a word at least two letters whose first letter is capitalized
#   and end with a . at the end of the line (after trimming).
# - there are exactly 1007 tasks
################################

# loop through framework file and record descriptions
for my $line (<NCWF>) {
    next if (length $line <= $margin);   # skip if there is no second column
    $line = substr $line, $margin;       # delete first column (margin)

    # make note of code (always a letter followed by 4 digits)
    if ($line =~ /^(T\d{4})/) {
        $code = $1;
    }

    next if (length $line <= $column);   # skip if there is no third column
    $line = substr $line, $column;        # delete second column (code);

    $line =~ s/\s+$//g;         # trim ending whitespace (including new-line)

    # add to description if we have found one, or if we are already in the middle of one
    if (!defined($description) && $line =~ /^[A-Z][a-z]+/) {
        $description = $line;
    } elsif(defined($description)) {
        $description = $description." ".$line;
    }

    # if the current line ends in a period, print these results and undefine our description
    if (defined($description) and $line =~ /\.$/) {
        print TABLE "$code\t$description\n";

        if($code eq "T1007") { last; }
        undef($code);
        undef($description);
    }
}

close NCWF;
close TABLE;

# Check work: find any missing entries
#   You'll want to manually go through and add periods missing in the framework file,
#       then re-run this script.
#   Technically, this won't notice if any leading or trailing records are missing,
#       so double check those yourself.

open TABLE, '<', $dat or die "Could not open the data file I presumably just created: $!";

my $exp = 1;  # the code we expect to see on each iteration
for my $line (<TABLE>) {
    # assign the 4 digit number to $num
    my ($num) = ($line =~ /^T(\d{4})/);
    # check if the task contains patterns we don't like
    if ($line =~ /NICE FRAMEWORK/) {
        print "Warning: entry T$num contains a page break.\n";
    } elsif ($line =~ /withdrawn/i) {
        print "Warning: entry T$num may have been withdrawn.\n";
    }
    # for each code we are missing, print a warning
    for my $i ($exp .. $num-1) {
        print "Warning: missing entry T$i - Framework file might be missing a period at the end.\n";
    }
    # look forward to the next code
    $exp = $num + 1;
}

close TABLE;
