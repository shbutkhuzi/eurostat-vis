#!/bin/bash

# Define the raw data directory
RAW_DIR="$(dirname "$0")"

# Array of datasets with their URLs and output filenames
declare -A datasets=(
    ["estat_migr_imm5prv.csv"]="https://ec.europa.eu/eurostat/api/dissemination/sdmx/3.0/data/dataflow/ESTAT/migr_imm5prv/1.0/*.*.*.*.*.*.*?c[freq]=A&c[partner]=BE,BG,CZ,DK,DE,EE,IE,EL,ES,FR,HR,IT,CY,LV,LT,LU,HU,MT,NL,AT,PL,PT,RO,SI,SK,FI,SE,IS,LI,NO,CH,UK,BA,ME,MD,MK,GE,AL,RS,TR,UA,XK,AD,BY,RU,SM,KG,TJ,UZ,AM,AZ,IL&c[agedef]=COMPLET&c[age]=TOTAL,Y_LT5,Y5-9,Y10-14,Y15-19,Y20-24,Y25-29,Y30-34,Y35-39,Y40-44,Y45-49,Y50-54,Y55-59,Y60-64,Y65-69,Y70-74,Y75-79,Y80-84,Y_GE85&c[unit]=NR&c[sex]=T,M,F&c[geo]=BE,BG,CZ,DK,DE,EE,IE,EL,ES,FR,HR,IT,CY,LV,LT,LU,HU,MT,NL,AT,PL,PT,RO,SI,SK,FI,SE,IS,LI,NO,CH,UK,BA,ME,MD,MK,TR,UA,BY,RU,SM,KG,TJ,UZ,AM,AZ,IL&c[TIME_PERIOD]=2023,2022,2021,2020,2019,2018,2017,2016,2015,2014,2013,2012,2011,2010,2009,2008,2007,2006,2005,2004,2003,2002,2001,2000,1999,1998&compress=false&format=csvdata&formatVersion=2.0&lang=en&labels=name"
    ["estat_migr_emi3nxt.csv"]="https://ec.europa.eu/eurostat/api/dissemination/sdmx/3.0/data/dataflow/ESTAT/migr_emi3nxt/1.0/*.*.*.*.*.*.*?c[freq]=A&c[partner]=BE,BG,CZ,DK,DE,EE,IE,EL,ES,FR,HR,IT,CY,LV,LT,LU,HU,MT,NL,AT,PL,PT,RO,SI,SK,FI,SE,IS,LI,NO,CH,UK,BA,ME,MD,MK,GE,AL,RS,TR,UA,XK,AD,BY,RU,SM,KG,TJ,UZ,AM,AZ,IL&c[agedef]=COMPLET&c[age]=TOTAL,Y_LT5,Y5-9,Y10-14,Y15-19,Y20-24,Y25-29,Y30-34,Y35-39,Y40-44,Y45-49,Y50-54,Y55-59,Y60-64,Y65-69,Y70-74,Y75-79,Y80-84,Y_GE85&c[unit]=NR&c[sex]=T,M,F&c[geo]=BE,BG,CZ,DK,DE,EE,IE,EL,ES,FR,HR,IT,CY,LV,LT,LU,HU,MT,NL,AT,PL,PT,RO,SI,SK,FI,SE,IS,LI,NO,CH,UK,MD,MK,UA,BY,RU,KG,TJ,UZ,AM,AZ,IL&c[TIME_PERIOD]=2023,2022,2021,2020,2019,2018,2017,2016,2015,2014,2013,2012,2011,2010,2009,2008,2007,2006,2005,2004,2003,2002,2001,2000,1999,1998&compress=false&format=csvdata&formatVersion=2.0&lang=en&labels=name"
    ["nama_10_gdp.csv"]="https://ec.europa.eu/eurostat/api/dissemination/sdmx/3.0/data/dataflow/ESTAT/nama_10_gdp/1.0/*.*.*.*?c[freq]=A&c[unit]=CP_MEUR&c[na_item]=B1GQ,D11&c[geo]=BE,BG,CZ,DK,DE,EE,IE,EL,ES,FR,HR,IT,CY,LV,LT,LU,HU,MT,NL,AT,PL,PT,RO,SI,SK,FI,SE,IS,LI,NO,CH,UK,BA,ME,MK,AL,RS,TR,UA,XK&c[TIME_PERIOD]=2024,2023,2022,2021,2020,2019,2018,2017,2016,2015,2014,2013,2012,2011,2010,2009,2008,2007,2006,2005,2004,2003,2002,2001,2000,1999,1998&compress=false&format=csvdata&formatVersion=2.0&lang=en&labels=name"
)

# Define column selections for each dataset (column numbers to keep)
# First, inspect your CSV to determine which columns to keep
declare -A column_filters=(
    ["estat_migr_imm5prv.csv"]="7,10,14,17,18,20"
    ["estat_migr_emi3nxt.csv"]="7,10,14,17,18,20"
    ["nama_10_gdp.csv"]="8,11,12,14"
)

# Iterate through datasets and download if not exists
for filename in "${!datasets[@]}"; do
    filepath="$RAW_DIR/$filename"
    temp_filepath="$RAW_DIR/${filename}.tmp"
    
    if [ -f "$filepath" ]; then
        echo "File $filename already exists, skipping download."
    else
        echo "Downloading $filename..."
        max_retries=10
        retry_count=0
        success=false
        
        while [ $retry_count -lt $max_retries ] && [ "$success" = false ]; do
            wget "${datasets[$filename]}" -O "$temp_filepath" 2>&1 | tee /tmp/wget_output.log
            
            # Check if the response indicates CSV data was received
            if grep -q "\[application/vnd.sdmx.data+csv\]" /tmp/wget_output.log; then
                echo "Successfully downloaded CSV data for $filename"
                
                # Apply column filtering if defined for this dataset
                if [ -n "${column_filters[$filename]}" ]; then
                    echo "Filtering columns for $filename..."
                    awk -v cols="${column_filters[$filename]}" '
                    BEGIN {
                        split(cols, arr, ",")
                    }
                    {
                        # Parse CSV line properly handling quoted fields
                        delete fields
                        field_count = 0
                        in_quotes = 0
                        current_field = ""
                        
                        for (i = 1; i <= length($0); i++) {
                            char = substr($0, i, 1)
                            
                            if (char == "\"") {
                                in_quotes = !in_quotes
                            } else if (char == "," && !in_quotes) {
                                field_count++
                                fields[field_count] = current_field
                                current_field = ""
                            } else {
                                current_field = current_field char
                            }
                        }
                        # Add last field
                        field_count++
                        fields[field_count] = current_field
                        
                        # Output selected columns
                        for (i = 1; i <= length(arr); i++) {
                            col_num = arr[i]
                            printf "%s%s", fields[col_num], (i < length(arr) ? "," : "\n")
                        }
                    }' "$temp_filepath" > "$filepath"
                    rm -f "$temp_filepath"
                else
                    # No filtering, just move the temp file
                    mv "$temp_filepath" "$filepath"
                fi
                
                success=true
            else
                retry_count=$((retry_count + 1))
                echo "Received non-CSV response (attempt $retry_count/$max_retries). Retrying in 5 seconds..."
                sleep 5
                rm -f "$temp_filepath"
            fi
        done
        
        if [ "$success" = false ]; then
            echo "Failed to download $filename after $max_retries attempts"
            rm -f "$temp_filepath"
        fi
    fi
done