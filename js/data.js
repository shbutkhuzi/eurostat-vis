const dataCtx = {
    GeoUrl: "data/ne_50m_admin_0_countries.geojson",
    BordersUrl: "data/ne_50m_admin_0_countries_borders.geojson",
    immDataUrl: "data/raw/estat_migr_imm5prv.csv",
    emiDataUrl: "data/raw/estat_migr_emi3nxt.csv",
    nama_10_gdp_Url: "data/raw/nama_10_gdp.csv",
    countryNameMap: {
        "Türkiye": "Turkey",
        "Serbia": "Republic of Serbia",
        "Kosovo*": "Kosovo"
    },
    ageGroupMap: {
        "Y_LT5": "0-4",
        "Y5-9": "5-9",
        "Y10-14": "10-14",
        "Y15-19": "15-19",
        "Y20-24": "20-24",
        "Y25-29": "25-29",
        "Y30-34": "30-34",
        "Y35-39": "35-39",
        "Y40-44": "40-44",
        "Y45-49": "45-49",
        "Y50-54": "50-54",
        "Y55-59": "55-59",
        "Y60-64": "60-64",
        "Y65-69": "65-69",
        "Y70-74": "70-74",
        "Y75-79": "75-79",
        "Y80-84": "80-84",
        "Y_GE85": "85+"
    }
}


function checkDataIntegrity(){

    let missingCountries = [];
    let invalidCoordinates = [];
    let incompleteSexDataImm = [];
    let incompleteSexDataEmi = [];
    let missingGdpCountries = [];
    let missingWagesCountries = [];
    let invalidAgeGroupsImm = [];
    let invalidAgeGroupsEmi = [];

    dataCtx.immDstCountries.forEach(country => {
        if (!dataCtx.countryInfo.has(country)) {
            missingCountries.push(country);
        } else {
            const info = dataCtx.countryInfo.get(country);
            if (info.center_x == null || info.center_y == null || 
                typeof info.center_x !== 'number' || typeof info.center_y !== 'number') {
                invalidCoordinates.push(country);
            }
        }
    });

    dataCtx.immSrcCountries.forEach(country => {
        if (!dataCtx.countryInfo.has(country)) {
            if (!missingCountries.includes(country)) {
                missingCountries.push(country);
            }
        } else {
            const info = dataCtx.countryInfo.get(country);
            if (info.center_x == null || info.center_y == null || 
                typeof info.center_x !== 'number' || typeof info.center_y !== 'number') {
                if (!invalidCoordinates.includes(country)) {
                    invalidCoordinates.push(country);
                }
            }
        }
    });

    dataCtx.emiSrcCountries.forEach(country => {
        if (!dataCtx.countryInfo.has(country)) {
            if (!missingCountries.includes(country)) {
                missingCountries.push(country);
            }
        } else {
            const info = dataCtx.countryInfo.get(country);
            if (info.center_x == null || info.center_y == null || 
                typeof info.center_x !== 'number' || typeof info.center_y !== 'number') {
                if (!invalidCoordinates.includes(country)) {
                    invalidCoordinates.push(country);
                }
            }
        }
    });

    dataCtx.emiDstCountries.forEach(country => {
        if (!dataCtx.countryInfo.has(country)) {
            if (!missingCountries.includes(country)) {
                missingCountries.push(country);
            }
        } else {
            const info = dataCtx.countryInfo.get(country);
            if (info.center_x == null || info.center_y == null || 
                typeof info.center_x !== 'number' || typeof info.center_y !== 'number') {
                if (!invalidCoordinates.includes(country)) {
                    invalidCoordinates.push(country);
                }
            }
        }
    });

    // Check sex data completeness for imm data: for each dstCountry, year and srcCountry there must be
    // either 3 different values: M, F and T;
    // or 2 different values: M and T or F and T;
    // or 1 distinct value: T;
    dataCtx.immDataGrouped.forEach((yearMap, dstCountry) => {
        yearMap.forEach((srcCountryMap, year) => {
            srcCountryMap.forEach((records, srcCountry) => {
                if (!Array.isArray(records) || records.length === 0) {
                    incompleteSexDataImm.push({ dstCountry, year, srcCountry, issue: `Empty or invalid records` });
                } else {
                    const sexValues = records.map(r => r.sex).sort();
                    const uniqueSex = [...new Set(sexValues)];
                    
                    if (records.length === 3) {
                        if (uniqueSex.length !== 3 || !uniqueSex.includes("M") || !uniqueSex.includes("F") || !uniqueSex.includes("T")) {
                            incompleteSexDataImm.push({ dstCountry, year, srcCountry, issue: `Expected [F, M, T], found [${sexValues.join(', ')}]` });
                        }
                    } else if (records.length === 2) {
                        const hasT = uniqueSex.includes("T");
                        const hasM = uniqueSex.includes("M");
                        const hasF = uniqueSex.includes("F");
                        if (!hasT || !(hasM || hasF)) {
                            incompleteSexDataImm.push({ dstCountry, year, srcCountry, issue: `Expected [M, T] or [F, T], found [${sexValues.join(', ')}]` });
                        }
                    } else if (records.length === 1) {
                        if (sexValues[0] !== "T") {
                            incompleteSexDataImm.push({ dstCountry, year, srcCountry, issue: `Expected [T], found [${sexValues.join(', ')}]` });
                        }
                    } else {
                        incompleteSexDataImm.push({ dstCountry, year, srcCountry, issue: `Unexpected record count: ${records.length}` });
                    }
                }
            });
        });
    });

    // Check sex data completeness for emi data: for each srcCountry, year and dstCountry there must be
    // either 3 different values: M, F and T;
    // or 2 different values: M and T or F and T;
    // or 1 distinct value: T;
    dataCtx.emiDataGrouped.forEach((yearMap, srcCountry) => {
        yearMap.forEach((dstCountryMap, year) => {
            dstCountryMap.forEach((records, dstCountry) => {
                if (!Array.isArray(records) || records.length === 0) {
                    incompleteSexDataEmi.push({ srcCountry, year, dstCountry, issue: `Empty or invalid records` });
                } else {
                    const sexValues = records.map(r => r.sex).sort();
                    const uniqueSex = [...new Set(sexValues)];
                    
                    if (records.length === 3) {
                        if (uniqueSex.length !== 3 || !uniqueSex.includes("M") || !uniqueSex.includes("F") || !uniqueSex.includes("T")) {
                            incompleteSexDataEmi.push({ srcCountry, year, dstCountry, issue: `Expected [F, M, T], found [${sexValues.join(', ')}]` });
                        }
                    } else if (records.length === 2) {
                        const hasT = uniqueSex.includes("T");
                        const hasM = uniqueSex.includes("M");
                        const hasF = uniqueSex.includes("F");
                        if (!hasT || !(hasM || hasF)) {
                            incompleteSexDataEmi.push({ srcCountry, year, dstCountry, issue: `Expected [M, T] or [F, T], found [${sexValues.join(', ')}]` });
                        }
                    } else if (records.length === 1) {
                        if (sexValues[0] !== "T") {
                            incompleteSexDataEmi.push({ srcCountry, year, dstCountry, issue: `Expected [T], found [${sexValues.join(', ')}]` });
                        }
                    } else {
                        incompleteSexDataEmi.push({ srcCountry, year, dstCountry, issue: `Unexpected record count: ${records.length}` });
                    }
                }
            });
        });
    });

    // Check GDP data countries
    dataCtx.gdpDataGrouped.forEach((yearMap, country) => {
        if (!dataCtx.countryInfo.has(country)) {
            missingGdpCountries.push(country);
        }
    });

    // Check wages and salary data countries
    dataCtx.wagesAndSalaryDataGrouped.forEach((yearMap, country) => {
        if (!dataCtx.countryInfo.has(country)) {
            missingWagesCountries.push(country);
        }
    });

    // Check age groups in immigration data
    const validAgeGroups = Object.values(dataCtx.ageGroupMap);
    const immDataFiltered = dataCtx.immDataWithAgeGroupsOnly.filter(d => d.age !== "TOTAL");
    immDataFiltered.forEach(d => {
        if (!validAgeGroups.includes(d.age)) {
            invalidAgeGroupsImm.push({ 
                dstCountry: d.dstCountry, 
                srcCountry: d.srcCountry, 
                year: d.year, 
                age: d.age, 
                issue: `Age group "${d.age}" not found in ageGroupMap` 
            });
        }
    });

    // Check age groups in emigration data
    const emiDataFiltered = dataCtx.emiDataWithAgeGroupsOnly.filter(d => d.age !== "TOTAL");
    emiDataFiltered.forEach(d => {
        if (!validAgeGroups.includes(d.age)) {
            invalidAgeGroupsEmi.push({ 
                srcCountry: d.srcCountry, 
                dstCountry: d.dstCountry, 
                year: d.year, 
                age: d.age, 
                issue: `Age group "${d.age}" not found in ageGroupMap` 
            });
        }
    });

    if (missingCountries.length > 0) {
        console.warn("Missing countries in geoJSON:", missingCountries);
    }

    if (invalidCoordinates.length > 0) {
        console.warn("Countries with invalid coordinates:", invalidCoordinates);
    }

    if (incompleteSexDataImm.length > 0) {
        console.warn("Incomplete sex data entries in Imm data:", incompleteSexDataImm);
    }

    if (incompleteSexDataEmi.length > 0) {
        console.warn("Incomplete sex data entries in Emi data:", incompleteSexDataEmi);
    }

    if (missingGdpCountries.length > 0) {
        console.warn("Countries in GDP data not found in countryInfo:", missingGdpCountries);
    }

    if (missingWagesCountries.length > 0) {
        console.warn("Countries in wages/salary data not found in countryInfo:", missingWagesCountries);
    }

    if (invalidAgeGroupsImm.length > 0) {
        console.warn("Invalid age groups in immigration data:", invalidAgeGroupsImm);
    }

    if (invalidAgeGroupsEmi.length > 0) {
        console.warn("Invalid age groups in emigration data:", invalidAgeGroupsEmi);
    }

    if (missingCountries.length === 0 && invalidCoordinates.length === 0 && incompleteSexDataImm.length === 0 && incompleteSexDataEmi.length === 0 && missingGdpCountries.length === 0 && missingWagesCountries.length === 0 && invalidAgeGroupsImm.length === 0 && invalidAgeGroupsEmi.length === 0) {
        console.log("Data integrity check passed!");
    }

}


function loadData(){
    
    return new Promise((resolve, reject) => {
        
        immDataWithAgeGr = d3.csv(dataCtx.immDataUrl, function(d) {
            
            const value = +d.OBS_VALUE;
            let dstCountry = d["Geopolitical entity (reporting)"];
            let srcCountry = d["Geopolitical entity (partner)"];
            let age = d["age"];

            if (value === 0 || dstCountry === srcCountry) {
                return null;
            }

            dstCountry = dataCtx.countryNameMap[dstCountry] || dstCountry;
            srcCountry = dataCtx.countryNameMap[srcCountry] || srcCountry;

            age = dataCtx.ageGroupMap[age] || age;

            return {
                dstCountry: dstCountry,
                srcCountry: srcCountry,
                year: +d.TIME_PERIOD,
                value: value,
                sex: d.sex,
                age: age
            };

        });

        emiDataWithAgeGr = d3.csv(dataCtx.emiDataUrl, function(d) {
            
            const value = +d.OBS_VALUE;
            let srcCountry = d["Geopolitical entity (reporting)"];
            let dstCountry = d["Geopolitical entity (partner)"];
            let age = d["age"];

            if (value === 0 || dstCountry === srcCountry) {
                return null;
            }

            dstCountry = dataCtx.countryNameMap[dstCountry] || dstCountry;
            srcCountry = dataCtx.countryNameMap[srcCountry] || srcCountry;

            age = dataCtx.ageGroupMap[age] || age;

            return {
                dstCountry: dstCountry,
                srcCountry: srcCountry,
                year: +d.TIME_PERIOD,
                value: value,
                sex: d.sex,
                age: age
            };

        });

        nama_10_gdp_data = d3.csv(dataCtx.nama_10_gdp_Url, function(d) {
            
            const value = +d.OBS_VALUE;
            let country = d["Geopolitical entity (reporting)"];

            if (value === 0) {
                return null;
            }

            country = dataCtx.countryNameMap[country] || country;

            return {
                country: country,
                year: +d.TIME_PERIOD,
                value: value,
                na_item: d.na_item
            };

        });

        geoJson = d3.json(dataCtx.GeoUrl);
        bordersJson = d3.json(dataCtx.BordersUrl);

        dataCtx.countryInfo = new Map();
        
        Promise.all([immDataWithAgeGr, emiDataWithAgeGr, nama_10_gdp_data, geoJson, bordersJson])
            .then((data) => {

                [immDataWithAgeGr, emiDataWithAgeGr, nama_10_gdp_data, geoJson, bordersJson] = data;

                immData = immDataWithAgeGr.filter(d => d.age === "TOTAL");
                emiData = emiDataWithAgeGr.filter(d => d.age === "TOTAL");

                dataCtx.immData = immData;
                dataCtx.emiData = emiData;

                dataCtx.gdpData = nama_10_gdp_data.filter(d => d.na_item === "B1GQ").map(({ na_item, ...rest }) => rest);
                dataCtx.wagesAndSalaryData = nama_10_gdp_data.filter(d => d.na_item === "D11").map(({ na_item, ...rest }) => rest);

                dataCtx.geoJson = geoJson;
                dataCtx.bordersJson = bordersJson;

                dataCtx.immDstCountries = [...new Set(immData.map(d => d.dstCountry))];
                dataCtx.immSrcCountries = [...new Set(immData.map(d => d.srcCountry))];
                dataCtx.emiDstCountries = [...new Set(emiData.map(d => d.dstCountry))];
                dataCtx.emiSrcCountries = [...new Set(emiData.map(d => d.srcCountry))];

                dataCtx.allMigrCountries = new Set([...dataCtx.immDstCountries, ...dataCtx.emiSrcCountries]);

                mapCtx.projection = d3.geoMercator().fitSize([mapCtx.MAP_WIDTH, mapCtx.MAP_HEIGHT], dataCtx.geoJson);


                dataCtx.immValueExt = d3.extent(dataCtx.immData.filter(d => d.sex === "T"), (d) => d.value);
                dataCtx.emiValueExt = d3.extent(dataCtx.emiData.filter(d => d.sex === "T"), (d) => d.value);
                dataCtx.migrValueExt = d3.extent([...dataCtx.immValueExt, ...dataCtx.emiValueExt]);

                geoJson.features.forEach(feature => {
                    const [px, py] = mapCtx.projection([feature.properties.LABEL_X, feature.properties.LABEL_Y]);

                    dataCtx.countryInfo.set(
                        feature.properties.GEOUNIT, 
                        {
                            center_x: feature.properties.LABEL_X, 
                            center_y: feature.properties.LABEL_Y,
                            px: px,
                            py: py
                        }
                    );
                });

                dataCtx.immDataGrouped = d3.group(immData, d => d.dstCountry, d => d.year, d => d.srcCountry);
                dataCtx.emiDataGrouped = d3.group(emiData, d => d.srcCountry, d => d.year, d => d.dstCountry);

                dataCtx.immDataWithAgeGroupsOnly = immDataWithAgeGr.filter(d => d.age !== "TOTAL");
                dataCtx.emiDataWithAgeGroupsOnly = emiDataWithAgeGr.filter(d => d.age !== "TOTAL");

                dataCtx.immDataWithAgeGrGrouped = d3.group(dataCtx.immDataWithAgeGroupsOnly,
                    d => d.dstCountry, d => d.year, d => d.srcCountry, d => d.age
                );

                dataCtx.emiDataWithAgeGrGrouped = d3.group(dataCtx.emiDataWithAgeGroupsOnly,
                    d => d.srcCountry, d => d.year, d => d.dstCountry, d => d.age
                );

                dataCtx.gdpDataGrouped = d3.group(dataCtx.gdpData, d => d.country, d => d.year);
                dataCtx.wagesAndSalaryDataGrouped = d3.group(dataCtx.wagesAndSalaryData, d => d.country, d => d.year);

                // checkDataIntegrity();

                // console.log("immData:", dataCtx.immData);
                // console.log("immDstCountries:", dataCtx.immDstCountries);
                // console.log("immSrcCoutries:", dataCtx.immSrcCountries);
                // console.log("immDataGrouped:", dataCtx.immDataGrouped);
                // console.log("immDataWithAgeGrGrouped:", dataCtx.immDataWithAgeGrGrouped);
                // console.log("emiData:", dataCtx.emiData);
                // console.log("emiDstCountries:", dataCtx.emiDstCountries);
                // console.log("emiSrcCoutries:", dataCtx.emiSrcCountries);
                // console.log("emiDataGrouped:", dataCtx.emiDataGrouped);
                // console.log("emiDataWithAgeGrGrouped:", dataCtx.emiDataWithAgeGrGrouped);
                // console.log("gdpDataGrouped:", dataCtx.gdpDataGrouped);
                // console.log("wagesAndSalaryDataGrouped:", dataCtx.wagesAndSalaryDataGrouped);
                // console.log("countryInfo:", dataCtx.countryInfo);
                // console.log("geoJson:", dataCtx.geoJson);
                
                resolve();

            }).catch(function(error){
                console.log(error);
                reject(error);
            });
    });

};



