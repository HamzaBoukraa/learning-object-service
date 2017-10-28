############################################
# This script is designed to extract "standardLO" information
#   from the CAE document describing IA/CD KU's. It puts it
#   into a tabular format so that a Node script can easily
#   read and insert items into the database.
#
# Before you can run this file, you need to
#   1) get the document:
#       https://www.iad.gov/NIETP/documents/Requirements/CAE-CD_Knowledge_Units.pdf
#   2) convert it into a text file:
#       a - install "ghostscript", if you don't already have it (try "which gs")
#       b - run this command from the directory with the pdf:
#               "gs -sDEVICE=txtwrite -o CAE-CD_Knowledge_Units.txt CAE-CD_Knowledge_Units.pdf"
#           NOTE: there are certainly other ways to convert pdf -> txt,
#                   but this script was designed around the file produced
#                   by the above command, using Ghostscript 9.18
#                   If a newer version does different things...good luck.
#                 If you elect to use a different conversion,
#                   you'll need to adapt this script to the new formatting.
#   3) move the new .txt file to LO Suggestion's 'dbcontent/rawdata' directory
# To actually run the file, run
#       "perl dbcontent/extract_CAE_data.pl" from the LO Suggestion root directory

# PARAMETERS
my $fmwk = "dbcontent/rawdata/CAE-CD_Knowledge_Units.txt"; # input file
my $dat = "dbcontent/CAE-CD_Knowledge_Units.dat";          # output file

# PROGRAM
use strict;
use warnings;

# load files
open CAE, '<', $fmwk or die "Could not find textified framework file. $!";
open TABLE, '>', $dat or die "Could not open file to write data to: $!";

my $code;
my $description;

################################
# Assumptions:
# - the KU name is the text in the line preceding one with "Definition:"
# - all the outcomes associated with the KU are bulleted under "Outcome(s):"
# - the bullet is symbol [239-130-183] and is followed by a space
# - there's a blank line following all outcomes, and none amidst them
# - every time "Outcome(s):" appears, there's at least one outcome
################################

my $name = "";    # Knowledge Unit name for each outcome
my $outcome = ""; # outcome text - may span multiple lines

my $prev = "";  # remember previous line in iteration
# loop through framework file and record outcomes
for my $line (<CAE>) {
    if ($line =~ /^\s*Definition:\s/) {
        $name = $prev;
        $name =~ s/^\s+|\s+$//g;         # trim whitespace (including new-line)
    }

    if ($outcome || $prev =~ /^\s*Outcomes?:\s*$/) {
        $line =~ s/^\s+|\s+$//g;         # trim whitespace (including new-line)

        if ($line) {
            my ($a,$b,$c) = (ord(substr $line,0,1),ord(substr $line,1,1),ord(substr $line,2,1));
            if ($a == 239 && $b == 130 && $c == 183) {   # if first character matches bullet profile
                if ($outcome) { # do not print if this is the first bullet
                    print TABLE "$name\t$outcome\n";
                }
                $outcome = substr($line, 4);
            } else {
                $outcome .= " ".$line;
            }
        } else {    # disable read-mode if we've come to a blank line
            print TABLE "$name\t$outcome\n";
            $outcome = "";
            next;
        }
    }

    $prev = $line;
}

close CAE;
close TABLE;
