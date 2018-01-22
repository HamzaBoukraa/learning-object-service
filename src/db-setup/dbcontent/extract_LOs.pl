# Starting point: CEPlearningOutcomes11May2015.xlsx
#       that's an excel document compiling all learning outcomes to [that] date
#
# Pre-processing:
# 1) save the "All Cyber LOs" sheet as a tab-delimited .csv file
# 2) For each group of LOs in the new .csv file:
#   - Replace the "Learning Outcome...student will be able to..." cell by the source (ex. "SIGSCE")
#   - Replace the "Context" cell by the year (ex. "2015")
# 3) Eliminate quotation marks:
#   - mostly stemming from newlines in the .xlsx cells
#   - some words are quoted, leave those quotes but delete the extraneous ones
# 4) There are a few duplicates. Eliminate them:
#   SIGCSE: Explain the importance and use of prime numbers in cryptography
#   SIGCSE: Sketch an simple industrial control system network
#   Military Academy: Apply basic security measures to common mobile devices such as device encryption
#
# To run file from root directory: `perl dbcontent/extract_LOs.pl`
#   Files for each group of LOs will be created: `[source] - [year].dat`
#
# Post-processing:
#   CAE's IA-Cyber Defense should NOT be used instead use primary-source extraction
#   CS2013's is missing a lot; instead use primary-source extraction

my $in = "dbcontent/rawdata/CEPlearningOutcomes11May2015.csv"; # input file

# PROGRAM
use strict;
use warnings;

# load files
open CSV, '<', $in or die "Could not find textified framework file. $!";

################################
# Assumptions:
# - Ignore the first 3 lines
# - LOs are grouped by source/year
# - If the 1st column is `Taxonomy Level`:
#     the 2nd column is the source and the 12th is the year
# - If the 1st column is neither empty nor `Taxonomy Level`,
#     the 2nd column is the outcome and the 12th is the context
# - If the 1st column is empty and the 2nd is not,
#     the 2nd column is a continuation of the current outcome.
################################

# shared by an entire group of outcomes - decides output name
my $source;
my $year;
# specific outcome values - constitutes a row of output
my $context;
my $outcome;

# bleed header
for my $i (1 .. 3) { my $line = <CSV>; }

for my $line (<CSV>) {
    my @cols = split /\t/, $line;
    # trim each line
    for my $col (@cols) { $col =~ s/^\s+|\s+$//g; }

    # if the first column is not empty and we have an outcome, write it
    if (defined($context) and $cols[0] ne "") {
        print OUT "$context\t$outcome\n";
    }

    if ($cols[0] eq "Taxonomy Level") {                 # new LO group
        # close the current output file (if it exists)
        if (defined($source)) { close OUT; }
        # switch out our variables
        $source = $cols[1];
        $year = $cols[11];
        undef $context;
        undef $outcome;
        # open the new output file
        open OUT, '>', "dbcontent/$source - $year.dat" or die "Could not open file to write data to: $!";
    } elsif ($cols[0] ne "") {                          # new LO
        $outcome = $cols[1];
        $context = $cols[11];
    } elsif ($cols[1] ne "") {
        $outcome .= " ".$cols[1];
    } # else                                              it's a blank line, ignore it

}

close OUT;
