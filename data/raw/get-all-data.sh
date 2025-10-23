#!/bin/bash

# Define the raw data directory
RAW_DIR="$(dirname "$0")"

# Array of datasets with their URLs and output filenames
declare -A datasets=(
    ["estat_migr_imm8.csv"]="https://ec.europa.eu/eurostat/api/dissemination/sdmx/3.0/data/dataflow/ESTAT/migr_imm8/1.0/*.*.*.*.*.*?c[freq]=A&c[agedef]=COMPLET&c[age]=TOTAL,Y_LT1,Y1,Y2,Y3,Y4,Y5,Y6,Y7,Y8,Y9,Y10,Y11,Y12,Y13,Y14,Y15,Y16,Y17,Y18,Y19,Y20,Y21,Y22,Y23,Y24,Y25,Y26,Y27,Y28,Y29,Y30,Y31,Y32,Y33,Y34,Y35,Y36,Y37,Y38,Y39,Y40,Y41,Y42,Y43,Y44,Y45,Y46,Y47,Y48,Y49,Y50,Y51,Y52,Y53,Y54,Y55,Y56,Y57,Y58,Y59,Y60,Y61,Y62,Y63,Y64,Y65,Y66,Y67,Y68,Y69,Y70,Y71,Y72,Y73,Y74,Y75,Y76,Y77,Y78,Y79,Y80,Y81,Y82,Y83,Y84,Y85,Y86,Y87,Y88,Y89,Y90,Y91,Y92,Y93,Y94,Y95,Y96,Y97,Y98,Y99,Y_GE100,UNK&c[unit]=NR&c[sex]=M,F&c[geo]=EU27_2020,BE,BG,CZ,DK,DE,EE,IE,EL,ES,FR,HR,IT,CY,LV,LT,LU,HU,MT,NL,AT,PL,PT,RO,SI,SK,FI,SE,IS,LI,NO,CH,UK,ME,MD,MK,UA&c[TIME_PERIOD]=2023,2022,2021,2020,2019,2018,2017,2016,2015,2014,2013,2012,2011,2010,2009,2008,2007,2006,2005,2004,2003,2002,2001,2000,1999,1998,1997,1996,1995,1994,1993,1992,1991,1990&compress=false&format=csvdata&formatVersion=2.0&lang=en&labels=name"
    ["estat_migr_emi2.csv"]="https://ec.europa.eu/eurostat/api/dissemination/sdmx/3.0/data/dataflow/ESTAT/migr_emi2/1.0/*.*.*.*.*.*?c[freq]=A&c[age]=TOTAL,Y_LT1,Y1,Y2,Y3,Y4,Y5,Y6,Y7,Y8,Y9,Y10,Y11,Y12,Y13,Y14,Y15,Y16,Y17,Y18,Y19,Y20,Y21,Y22,Y23,Y24,Y25,Y26,Y27,Y28,Y29,Y30,Y31,Y32,Y33,Y34,Y35,Y36,Y37,Y38,Y39,Y40,Y41,Y42,Y43,Y44,Y45,Y46,Y47,Y48,Y49,Y50,Y51,Y52,Y53,Y54,Y55,Y56,Y57,Y58,Y59,Y60,Y61,Y62,Y63,Y64,Y65,Y66,Y67,Y68,Y69,Y70,Y71,Y72,Y73,Y74,Y75,Y76,Y77,Y78,Y79,Y80,Y81,Y82,Y83,Y84,Y85,Y86,Y87,Y88,Y89,Y90,Y91,Y92,Y93,Y94,Y95,Y96,Y97,Y98,Y99,Y_GE100,UNK&c[agedef]=COMPLET&c[unit]=NR&c[sex]=M,F&c[geo]=EU27_2020,BE,BG,CZ,DK,DE,EE,IE,EL,ES,FR,HR,IT,CY,LV,LT,LU,HU,MT,NL,AT,PL,PT,RO,SI,SK,FI,SE,IS,LI,NO,CH,UK,MD,MK,UA,BY,RU,SM,KG,TJ,UZ,AM,AZ&c[TIME_PERIOD]=2023,2022,2021,2020,2019,2018,2017,2016,2015,2014,2013,2012,2011,2010,2009,2008,2007,2006,2005,2004,2003,2002,2001,2000,1999,1998,1997,1996,1995,1994,1993,1992,1991,1990&compress=false&format=csvdata&formatVersion=2.0&lang=en&labels=name"
)

# Iterate through datasets and download if not exists
for filename in "${!datasets[@]}"; do
    filepath="$RAW_DIR/$filename"
    if [ -f "$filepath" ]; then
        echo "File $filename already exists, skipping download."
    else
        echo "Downloading $filename..."
        wget "${datasets[$filename]}" -O "$filepath"
    fi
done