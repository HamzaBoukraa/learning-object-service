############################################
# Given a MySQL dump file from old heroku schema,
#   create a tab-delimited file of "rows" readable by Node.
# To run, from LO Suggestion root directory:
#   "perl dbcontent/extract_Dump_data.pl"

# PARAMETERS
my $dump = "dbcontent/rawdata/Dump20171010.sql";     # input file
my $dat = "dbcontent/Dump20171010.dat";              # output file

# PROGRAM
use strict;
use warnings;

# load files
open DUMP,  '<', $dump or die "Could not find textified dump file. $!";
open TABLE, '>', $dat  or die "Could not open file to write data to: $!";

################################
# Assumptions:
#  - there is exactly one "INSERT INTO 'learning_objects' VALUES ("~~~");" line
#  - each object is in the ~~~ above, delimited by "),("
#  - each object consists of a number, string, string, number, date separated by commas
#  - none of the objects contain ' characters, except those marking the objects...
################################

for my $line (<DUMP>) {
    if ($line =~ /^INSERT INTO `learning_objects` VALUES \((.*)\);\s*$/) {
        my @objects = split(/\),\(/, $1);
        for my $object (@objects) {
            my ($id, $name, $content, $userid, $date) = $object =~ /(\d+),'(.*)','(.*)',(\d+),'(.*)'/;
            # unescape all quotation marks to create valid JSON
            $content =~ s/\\"/"/g;
            print TABLE "$id\t$name\t$content\t$userid\t$date\n";
        }
        last;   # we only care about the one INSERT line
    }
}