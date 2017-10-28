############################################
# This script is designed to extract "standardLO" information
#   from the CS 2013 learning outcomes into a tabular format
#   so that a Node script can easily read and insert items into
#   the database.
#
# Before you can run this file, you need to
#   1) get the spreadsheet:
#       http://ai.stanford.edu/users/sahami/CS2013/exemplars/CurriculumExemplarTemplate.xlsx
#   2) convert it into a .csv file:
#       a - open in Excel
#       b - switch to the "Learning Outcomes" sheet
#       c - save it as a .csv, using <tab> as the field delimiter
#       d - name the file "CS_2013_Learning Outcomes" so you don't have to change anything here
#   3) move the new .csv file to LO Suggestion's 'dbcontent/rawdata' directory
# To actually run the file, run
#       "perl dbcontent/extract_CS2013_data.pl" from the LO Suggestion root directory

# PARAMETERS
my $fmwk = "dbcontent/rawdata/CS_2013_Learning_Outcomes.csv"; # input file
my $dat = "dbcontent/CS_2013_Learning_Outcomes.dat";          # output file

# PROGRAM
use strict;
use warnings;

# load files
open CS2013, '<', $fmwk or die "Could not find textified framework file. $!";
open TABLE, '>', $dat or die "Could not open file to write data to: $!";

my $code;
my $description;

################################
# Assumptions:
# - LO is in 6th column
# - KU is in 2nd column
################################

my $name = "";    # Knowledge Unit name for each outcome
my $outcome = ""; # outcome text - may span multiple lines

my $prev = "";  # remember previous line in iteration
# loop through framework file and record outcomes
for my $line (<CS2013>) {
    my @cols = split /\t/, $line;

    # skip this line if it hasn't got an outcome or if it's the header line
    next if (scalar @cols < 6 || length $cols[5] == 0 || $cols[1] eq "KU" );

    my ($ku, $outcome) = ($cols[1], $cols[5]);
    print TABLE "$ku\t$outcome\n";
}

close CS2013;
close TABLE;
