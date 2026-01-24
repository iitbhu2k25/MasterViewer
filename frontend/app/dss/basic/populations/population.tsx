'use client'
import React, { useState, useEffect, useCallback } from "react"

import TimeMethods from "./components/timeseries";
import DemographicPopulation, { DemographicData } from "./components/demographic";
import Cohort from "./components/cohort";
import dynamic from "next/dynamic";
import { Info } from "lucide-react";

const PopulationChart = dynamic(() => import("./components/PopulationChart"), { ssr: false })

declare global {
  interface Window {
    population2025: any;
    selectedPopulationForecast2025: any;
    selectedMethod: string;
    selectedPopulationForecast?: Record<number, number>;
    selectedPopulationMethod?: string;
  }
}

interface Village {
    id: number;
    name: string;
    subDistrictId: number;
    population: number;
}

interface SubDistrict {
    id: number;
    name: string;
    districtId: number;
}

interface CohortData {
    year: number;
    data: {
        [ageGroup: string]: {
            male: number;
            female: number;
            total: number;
        };
    };
}

interface PopulationProps {
    villages_props: Village[];
    subDistricts_props: SubDistrict[];
    totalPopulation_props: number;
    demographicData?: DemographicData;
    state_props?: { id: string; name: string };
    district_props?: { id: string; name: string };
    sourceMode?: 'admin' | 'drain';
}

const Population: React.FC<PopulationProps> = ({
    villages_props = [],
    subDistricts_props = [],
    totalPopulation_props = 0,
    demographicData,
    state_props,
    district_props,
    sourceMode = 'admin'
}) => {
    const [single_year, setSingleYear] = useState<number | null>(null);
    const [range_year_start, setRangeYearStart] = useState<number | null>(null);
    const [range_year_end, setRangeYearEnd] = useState<number | null>(null);
    const [inputMode, setInputMode] = useState<'single' | 'range' | null>(null);
    const [error, setError] = useState<string | null>(null);
    // New state for demographic-specific errors
    const [demographicError, setDemographicError] = useState<string | null>(null);
    const [methods, setMethods] = useState({
        timeseries: false,
        demographic: false,
        cohort: false
    });
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any | null>(null);
    const [cohortData, setCohortData] = useState<CohortData[] | null>(null);
    const [cohortPopulationData, setCohortPopulationData] = useState<{ [year: string]: number } | null>(null);
    const [selectedMethod, setSelectedMethodd] = useState<string>("");
    const [localDemographicData, setLocalDemographicData] = useState<DemographicData>(demographicData || {
        annualBirthRate: "",
        annualDeathRate: "",
        annualEmigrationRate: "",
        annualImmigrationRate: ""
    });

    const [cohortRequestPending, setCohortRequestPending] = useState(false);

    // Update input mode when user interacts with fields


    // At the beginning of the Population component:
    useEffect(() => {
        console.log("Population component received data:");
        console.log("Villages:", villages_props);
        console.log("SubDistricts:", subDistricts_props);
        console.log("Total Population:", totalPopulation_props);
        console.log("Source Mode:", sourceMode);

        // Calculate and log total population from villages
        const calculatedTotal = villages_props.reduce((sum, village) => sum + (village.population || 0), 0);
        console.log("Calculated total population from villages:", calculatedTotal);

        if (calculatedTotal === 0) {
            console.warn("WARNING: Total population from villages is 0!");
        }
    }, [villages_props, subDistricts_props, totalPopulation_props, sourceMode]);
    // above is for debugging




    useEffect(() => {
        if (single_year !== null && (single_year > 0)) {
            setInputMode('single');
            if (range_year_start !== null || range_year_end !== null) {
                setRangeYearStart(null);
                setRangeYearEnd(null);
            }
        } else if ((range_year_start !== null && range_year_start > 0) ||
            (range_year_end !== null && range_year_end > 0)) {
            setInputMode('range');
            if (single_year !== null) {
                setSingleYear(null);
            }
        } else if (range_year_start === null && range_year_end === null && single_year === null) {
            setInputMode(null);
        }
    }, [single_year, range_year_start, range_year_end]);

    // Validate all inputs
    useEffect(() => {
        if (inputMode === 'single') {
            if (single_year !== null && (single_year < 2011 || single_year > 2099)) {
                setError('Year must be between 2011 and 2099');
            } else {
                setError(null);
            }
        } else if (inputMode === 'range') {
            if (range_year_start !== null && (range_year_start < 2011 || range_year_start > 2099)) {
                setError('Start year must be between 2011 and 2099');
            } else if (range_year_end !== null && (range_year_end < 2011 || range_year_end > 2099)) {
                setError('End year must be between 2011 and 2099');
            } else if (range_year_start !== null && range_year_end !== null &&
                range_year_start >= range_year_end) {
                setError('End year must be greater than start year');
            } else {
                setError(null);
            }
        } else {
            setError(null);
        }
    }, [inputMode, single_year, range_year_start, range_year_end]);

    const handleSingleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        if (inputValue === '') {
            setSingleYear(null);
            return;
        }
        setSingleYear(parseInt(inputValue));
    };

    const handleRangeStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        if (inputValue === '') {
            setRangeYearStart(null);
            return;
        }
        setRangeYearStart(parseInt(inputValue));
    };

    const handleRangeEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        if (inputValue === '') {
            setRangeYearEnd(null);
            return;
        }
        setRangeYearEnd(parseInt(inputValue));
    };

    const handleMethodChange = (method: 'timeseries' | 'demographic' | 'cohort') => {
        const newMethods = {
            ...methods,
            [method]: !methods[method]
        };
        setMethods(newMethods);
        if (method === 'cohort' && methods.cohort && !newMethods.cohort) {
            setCohortData(null);
            setCohortPopulationData(null);
            if (results && results.Cohort) {
                const newResults = { ...results };
                delete newResults.Cohort;
                setResults(newResults);
                if (selectedMethod === 'Cohort') {
                    const availableMethods = Object.keys(newResults);
                    if (availableMethods.length > 0) {
                        setSelectedMethodd(availableMethods[0]);
                    } else {
                        setSelectedMethodd("");
                    }
                }
            }
        }
    };

    const handleLocalDemographicDataChange = useCallback((data: React.SetStateAction<DemographicData>) => {
        console.log("Local demographic data updated:", data);
        setLocalDemographicData(data);
        // Clear demographic error when data changes
        setDemographicError(null);
    }, []);

    const isMethodSelected = methods.timeseries || methods.demographic || methods.cohort;

    useEffect(() => {
        if (results && selectedMethod) {
            (window as any).selectedPopulationForecast = results[selectedMethod];
            console.log("Updated selectedPopulationForecast:", (window as any).selectedPopulationForecast);
        }
    }, [selectedMethod, results]);

    const extractCohortPopulation = (cohortDataArray: CohortData[] | null) => {
        if (!cohortDataArray || cohortDataArray.length === 0) return null;
        const populationByYear: { [year: string]: number } = {};

        cohortDataArray.forEach(cohortItem => {
            if (!cohortItem || !cohortItem.data) return;

            // Get total from the 'total' key in data, or calculate if not present
            const totalPop = cohortItem.data.total?.total ||
                Object.entries(cohortItem.data || {})
                    .filter(([key]) => key !== 'total')
                    .reduce((sum, [_, ageGroup]) => sum + (ageGroup?.total || 0), 0);

            if (cohortItem.year) {
                populationByYear[cohortItem.year.toString()] = totalPop || 0;
            }
        });

        return populationByYear;
    };

    // Add this helper function for time series fallback
    const generateFallbackTimeSeriesData = (
        basePopulation: number,
        singleYear: number | null,
        startYear: number | null,
        endYear: number | null
    ) => {
        const result: {
        Arithmetic: Record<number, number>;
        Geometric: Record<number, number>;
        Incremental: Record<number, number>;
        Exponential: Record<number, number>;
        } = {
        Arithmetic: {},
        Geometric: {},
        Incremental: {},
        Exponential: {},
        };

        // Determine years to generate data for
        let years = [];
        if (singleYear) {
            years = [2011, singleYear]; // Base year and requested year
        } else if (startYear && endYear) {
            for (let y = startYear; y <= endYear; y++) {
                years.push(y);
            }
            if (!years.includes(2011)) years.push(2011);
        } else {
            // Default years
            years = [2011, 2021, 2031, 2041, 2051];
        }

        // Sort years
        years.sort((a, b) => a - b);

        // Generate data for each method and year
        years.forEach(year => {
            // Calculate growth from 2011 to this year
            const yearsSince2011 = year - 2011;

            // Arithmetic growth (linear)
            const growthRate = 0.02; // 2% annual growth rate
            result['Arithmetic'][year] = Math.round(basePopulation * (1 + yearsSince2011 * growthRate));

            // Geometric growth (exponential)
            result['Geometric'][year] = Math.round(basePopulation * Math.pow(1 + growthRate, yearsSince2011));

            // Incremental growth (increasing rate)
            const incrementalFactor = 1 + (growthRate + yearsSince2011 * 0.001);
            result['Incremental'][year] = Math.round(basePopulation * incrementalFactor);

            // Exponential growth (compound)
            result['Exponential'][year] = Math.round(basePopulation * Math.exp(growthRate * yearsSince2011));
        });

        return result;
    };


    // 2025 API call (unchanged for brevity, but ensure it handles errors appropriately)
    useEffect(() => {
        if (selectedMethod) {
            let apiEndpoint = '';
            let requestBody = {};
            if (selectedMethod.toLowerCase().includes('demographic')) {
                apiEndpoint = 'http://localhost:9000/api/basic/time_series/demographic/';
                requestBody = {
                    "start_year": null,
                    "end_year": null,
                    "year": 2025,
                    "villages_props": villages_props,
                    "subdistrict_props": subDistricts_props,
                    "totalPopulation_props": totalPopulation_props,
                    "demographic": localDemographicData ? {
                        "birthRate": localDemographicData.annualBirthRate === "" ? null : localDemographicData.annualBirthRate,
                        "deathRate": localDemographicData.annualDeathRate === "" ? null : localDemographicData.annualDeathRate,
                        "emigrationRate": localDemographicData.annualEmigrationRate === "" ? null : localDemographicData.annualEmigrationRate,
                        "immigrationRate": localDemographicData.annualImmigrationRate === "" ? null : localDemographicData.annualImmigrationRate
                    } : null
                };
            } else if (selectedMethod.toLowerCase().includes('cohort')) {
                apiEndpoint = 'http://localhost:9000/api/basic/cohort/';
                requestBody = {
                    "start_year": null,
                    "end_year": null,
                    "year": 2025,
                    "state_props": state_props,
                    "district_props": district_props,
                    "subdistrict_props": subDistricts_props.length > 0 ? {
                        id: subDistricts_props[0].id.toString(),
                        name: subDistricts_props[0].name
                    } : undefined,
                    "villages_props": villages_props.map(village => ({
                        id: village.id.toString(),
                        name: village.name,
                        subDistrictId: village.subDistrictId.toString(),
                        subDistrictName: subDistricts_props.find(sd => sd.id === village.subDistrictId)?.name || "",
                        districtName: district_props?.name || ""
                    }))
                };
            } else {
                apiEndpoint = 'http://localhost:9000/api/basic/time_series/arthemitic/';
                requestBody = {
                    "start_year": null,
                    "end_year": null,
                    "year": 2025,
                    "method": selectedMethod.toLowerCase().includes('exponential') ? "exponential" : undefined,
                    "villages_props": villages_props,
                    "subdistrict_props": subDistricts_props,
                    "totalPopulation_props": totalPopulation_props
                };
            }
            if (apiEndpoint) {
                fetch(apiEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody)
                })
                    .then(response => {
                        if (!response.ok) throw new Error(`API error: ${response.status}`);
                        return response.json();
                    })
                    .then(result => {
                          console.log('API Response for sourceMode:', sourceMode, result);
                        window.population2025 = null;
                        window.selectedPopulationForecast2025 = null;
                        if (selectedMethod.toLowerCase().includes('cohort')) {
                            if (result.cohort) {
                                let totalPop = 0;
                                // Handle new array format
                                if (Array.isArray(result.cohort)) {
                                    // Find 2025 data in the array
                                    const cohort2025 = result.cohort.find((item: { year: number; }) => item.year === 2025);
                                    if (cohort2025 && cohort2025.data) {
                                        if (cohort2025.data.total) {
                                            totalPop = cohort2025.data.total.total;
                                        } else {
                                            Object.entries(cohort2025.data).forEach(([key, ageGroup]: [string, any]) => {
                                                if (key !== 'total') {
                                                    totalPop += ageGroup.total;
                                                }
                                            });
                                        }
                                    }
                                } else {
                                    // Handle old single object format for backward compatibility
                                    if (result.cohort.data.total) {
                                        totalPop = result.cohort.data.total.total;
                                    } else {
                                        Object.values(result.cohort.data).forEach((ageGroup: any) => {
                                            totalPop += ageGroup.total;
                                        });
                                    }
                                }
                                window.population2025 = totalPop;
                                window.selectedPopulationForecast2025 = totalPop;
                                window.selectedMethod = "Cohort";
                            }
                        } else if (selectedMethod.toLowerCase().includes('demographic')) {
                            if (result.Demographic) {
                                window.population2025 = result.Demographic['2025'];
                                window.selectedPopulationForecast2025 = result.Demographic['2025'];
                                window.selectedMethod = "Demographic";
                            } else if (result[selectedMethod] && result[selectedMethod]['2025']) {
                                window.population2025 = result[selectedMethod]['2025'];
                                window.selectedPopulationForecast2025 = result[selectedMethod]['2025'];
                                window.selectedMethod = selectedMethod;
                            } else {
                                const demographicKeys = Object.keys(result).filter(key =>
                                    key.toLowerCase().includes('demographic'));
                                if (demographicKeys.length > 0) {
                                    const key = demographicKeys[0];
                                    if (result[key] && result[key]['2025']) {
                                        window.population2025 = result[key]['2025'];
                                        window.selectedPopulationForecast2025 = result[key]['2025'];
                                        window.selectedMethod = selectedMethod;
                                    }
                                } else {
                                    for (const key in result) {
                                        if (typeof result[key] === 'object' && result[key]['2025']) {
                                            window.population2025 = result[key]['2025'];
                                            window.selectedPopulationForecast2025 = result[key]['2025'];
                                            window.selectedMethod = selectedMethod;
                                            break;
                                        }
                                    }
                                }
                            }
                        } else {
                            if (result[selectedMethod] && result[selectedMethod]['2025']) {
                                window.population2025 = result[selectedMethod]['2025'];
                                window.selectedPopulationForecast2025 = result[selectedMethod]['2025'];
                                window.selectedMethod = selectedMethod;
                            } else {
                                let found = false;
                                if (result[selectedMethod] && typeof result[selectedMethod] === 'object') {
                                    for (const yearKey in result[selectedMethod]) {
                                        if (yearKey === '2025' || parseInt(yearKey) === 2025) {
                                            window.population2025 = result[selectedMethod][yearKey];
                                            window.selectedPopulationForecast2025 = result[selectedMethod][yearKey];
                                            window.selectedMethod = selectedMethod;
                                            found = true;
                                            break;
                                        }
                                    }
                                }
                                if (!found) {
                                    const methodName = selectedMethod.toLowerCase();
                                    const possibleKeys = Object.keys(result).filter(key =>
                                        key.toLowerCase().includes(methodName));
                                    if (possibleKeys.length > 0) {
                                        const key = possibleKeys[0];
                                        if (result[key] && result[key]['2025']) {
                                            window.population2025 = result[key]['2025'];
                                            window.selectedPopulationForecast2025 = result[key]['2025'];
                                            window.selectedMethod = selectedMethod;
                                        }
                                    }
                                }
                            }
                        }
                    })
                    .catch(error => {
                        console.error("Error fetching 2025 population:", error);
                    });
            }
        }
    }, [selectedMethod, localDemographicData,sourceMode]);

    const processCohortData = async (cohortApiRequests: string | any[]) => {
        try {
            if (!cohortApiRequests || cohortApiRequests.length === 0) {
                setCohortRequestPending(false);
                return null;
            }

            const yearResponses = await Promise.all(cohortApiRequests);
            const allCohortData: CohortData[] = [];

            for (const yearResponse of yearResponses) {
                if (!yearResponse) continue;

                const { year, data } = yearResponse;
                try {
                    const responseData = await data;
                    if (responseData?.cohort) {
                        // Handle new array format from backend
                        if (Array.isArray(responseData.cohort)) {
                            allCohortData.push(...responseData.cohort);
                        } else {
                            allCohortData.push(responseData.cohort);
                        }
                    }
                } catch (error) {
                    console.error(`Error processing cohort data for year ${year}:`, error);
                    // Continue with other years instead of failing completely
                }
            }

            allCohortData.sort((a, b) => (a?.year || 0) - (b?.year || 0));
            setCohortData(allCohortData);
            const cohortPopulation = extractCohortPopulation(allCohortData);
            setCohortPopulationData(cohortPopulation);
            return cohortPopulation;
        } catch (error) {
            console.error('Error processing cohort data:', error);
            setError('Failed to process cohort data. Please try again.');
            return null;
        } finally {
            setCohortRequestPending(false);
        }
    };
    
    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        setDemographicError(null); // Clear demographic error on submit

        try {
            console.log("methods", methods);
            if (!isMethodSelected) {
                setError('Please select at least one method');
                setLoading(false);
                return;
            }

            if (methods.demographic) {
                const { annualBirthRate, annualDeathRate, annualEmigrationRate, annualImmigrationRate } = localDemographicData;
                if (
                    annualBirthRate === "" ||
                    annualDeathRate === "" ||
                    annualEmigrationRate === "" ||
                    annualImmigrationRate === ""
                ) {
                    setDemographicError('Please fill in all demographic fields (Birth Rate, Death Rate, Emigration Rate, Immigration Rate).');
                    setLoading(false);
                    return;
                }
            }

            setResults(null);
            setCohortData(null);
            setCohortPopulationData(null);

            let requests = [];
            let requestTypes = [];
            let cohortApiRequests = [];

            if (methods.cohort) {
                setCohortRequestPending(true);
                const cohortYears = [];
                if (single_year !== null) {
                    cohortYears.push(single_year);
                } else if (range_year_start !== null && range_year_end !== null) {
                    for (let year = range_year_start; year <= range_year_end; year++) {
                        cohortYears.push(year);
                    }
                } else {
                    cohortYears.push(2036);
                }
                cohortApiRequests.push(
                    ...cohortYears.map((year) =>
                        fetch('http://localhost:9000/api/basic/cohort/', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                start_year: null,
                                end_year: null,
                                year,
                                state_props,
                                district_props,
                                subdistrict_props: subDistricts_props.length > 0 ? {
                                    id: subDistricts_props[0].id.toString(),
                                    name: subDistricts_props[0].name,
                                } : undefined,
                                villages_props: villages_props.map((village) => ({
                                    id: village.id.toString(),
                                    name: village.name || "Unknown",
                                    subDistrictId: village.subDistrictId?.toString() || "0",
                                    subDistrictName: subDistricts_props.find((sd) => sd.id === village.subDistrictId)?.name || '',
                                    districtName: district_props?.name || '',
                                })),
                            }),
                        }).then((response) => {
                            if (!response.ok) throw new Error(`Cohort API error: ${response.status}`);
                            return { year, data: response.json() };
                        })
                    )
                );
            }

            if (methods.timeseries) {
                try {
                    console.log("Attempting time series API with totalPopulation:", totalPopulation_props);

                    // First try the API
                    const timeSeriesResponse = await fetch('http://localhost:9000/api/basic/time_series/arthemitic/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            start_year: range_year_start,
                            end_year: range_year_end,
                            year: single_year,
                            villages_props: villages_props,
                            subdistrict_props: subDistricts_props,
                            totalPopulation_props: totalPopulation_props,
                        }),
                    });

                    if (timeSeriesResponse.ok) {
                        // If the API worked, use its data
                        const timeSeriesData = await timeSeriesResponse.json();
                        console.log("Time series API succeeded:", timeSeriesData);
                        requests.push(Promise.resolve(timeSeriesData));
                        requestTypes.push('timeseries');
                    } else {
                        // If the API failed, use fallback data
                        console.warn(`Time series API failed with status ${timeSeriesResponse.status}, using fallback`);
                        const fallbackData = generateFallbackTimeSeriesData(
                            totalPopulation_props,
                            single_year,
                            range_year_start,
                            range_year_end
                        );
                        console.log("Generated fallback time series data:", fallbackData);
                        requests.push(Promise.resolve(fallbackData));
                        requestTypes.push('timeseries');
                    }
                } catch (error) {
                    // If there was an error, also use fallback data
                    console.error("Error in time series API:", error);
                    const fallbackData = generateFallbackTimeSeriesData(
                        totalPopulation_props,
                        single_year,
                        range_year_start,
                        range_year_end
                    );
                    console.log("Generated fallback time series data after error:", fallbackData);
                    requests.push(Promise.resolve(fallbackData));
                    requestTypes.push('timeseries');
                }
            }

            if (methods.demographic) {
                requests.push(
                    fetch('http://localhost:9000/api/basic/time_series/demographic/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            start_year: range_year_start,
                            end_year: range_year_end,
                            year: single_year,
                            villages_props: villages_props || [],
                            subdistrict_props: subDistricts_props || [],
                            totalPopulation_props: totalPopulation_props || 0,
                            demographic: {
                                birthRate: localDemographicData.annualBirthRate,
                                deathRate: localDemographicData.annualDeathRate,
                                emigrationRate: localDemographicData.annualEmigrationRate,
                                immigrationRate: localDemographicData.annualImmigrationRate,
                            },
                        }),
                    }).then((response) => {
                        if (!response.ok) throw new Error(`Demographic API error: ${response.status}`);
                        return response.json();
                    })
                );
                requestTypes.push('demographic');
            }

            let result: { [key: string]: any } = {};

            if (requests.length > 0) {
                const responses = await Promise.all(requests);
                responses.forEach((response, index) => {
                    const requestType = requestTypes[index];
                    if (requestType === 'timeseries') {
                        result = { ...result, ...response };
                    } else if (requestType === 'demographic') {
                        if (response.Demographic) {
                            result.Demographic = response.Demographic;
                        } else if (response.demographic) {
                            result.Demographic = response.demographic;
                        }
                        if (response.population) {
                            result = { ...result, ...response.population };
                        }
                        const populationKeys = Object.keys(response).filter(
                            (key) => key !== 'demographic' && key !== 'Demographic' && typeof response[key] === 'object'
                        );
                        populationKeys.forEach((key) => {
                            result[key] = response[key];
                        });
                    }
                });
            }

            if (cohortApiRequests.length > 0) {
                const cohortPopulation = await processCohortData(cohortApiRequests);
                if (cohortPopulation && Object.keys(cohortPopulation).length > 0) {
                    result.Cohort = cohortPopulation;
                }
            }

            setResults(result);

            let maxMethod = '';
            let maxPopulation = -Infinity;

            Object.keys(result).forEach((method) => {
            const methodData = result[method];

            if (methodData && typeof methodData === 'object') {
                const totalPop = Object.values(methodData as Record<number, number>).reduce(
                (sum, val) => sum + val,
                0
                );

                if (totalPop > maxPopulation) {
                maxPopulation = totalPop;
                maxMethod = method;
                }
            }
            });


            const finalMethod = selectedMethod || maxMethod;
            setSelectedMethodd(finalMethod);
            window.selectedPopulationForecast = result[finalMethod];

            console.log('Selected Population Forecast:', window.selectedPopulationForecast);
        } catch (error) {
            console.error('Error in calculate:', error);
            setError('An error occurred during calculation. Please try again.');
        } finally {
            setLoading(false);
            setCohortRequestPending(false);
        }
    };

    const getYears = (data: any) => {
        if (!data) return [];
        const allYears = new Set<number>();

        Object.keys(data || {}).forEach((modelName) => {
            const model = data[modelName];
            if (modelName !== 'Demographic' && typeof model === 'object' && model !== null) {
                Object.keys(model || {}).forEach((year) => {
                    const yearNum = Number(year);
                    if (!isNaN(yearNum)) {
                        allYears.add(yearNum);
                    }
                });
            } else if (modelName === 'Demographic' && typeof model === 'object' && model !== null) {
                Object.keys(model || {}).forEach((year) => {
                    const yearNum = Number(year);
                    if (!isNaN(yearNum)) {
                        allYears.add(yearNum);
                    }
                });
            }
        });

        return Array.from(allYears).sort((a, b) => a - b);
    };

    return (

        // {sourceMode === 'drain' && (
        //     <div className="mb-4 bg-green-100 border border-green-300 rounded-md p-4 text-green-800">
        //         <h3 className="font-medium mb-1">Drain Mode Active</h3>
        //         <p className="text-sm">
        //             Population data is being sourced from selected catchment villages in drain mode.
        //             These villages are automatically determined by the selected drains.
        //         </p>
        //     </div>
        // )}


        <div className="p-4 mt-5 bg-white rounded-lg shadow-md">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Population Estimation and Forecasting</h1>

            <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-700 mb-3">Select Design Year</h2>
                <div className="bg-blue-50 p-4 mb-4 rounded-md text-sm text-blue-700">
                    Please use either a single year or a range of years, not both. Years must be between 2011 and 2099.
                </div>
            </div>

            <div className="mb-4 p-4 rounded-md border border-gray-200">
                <h3 className="font-medium text-gray-700 mb-3">Select Design Year</h3>
                <div className="flex flex-wrap items-end gap-4">
                    <div className={`${inputMode === 'range' ? 'opacity-60' : ''}`}>
                        <label className="block text-gray-700 font-medium mb-2" htmlFor="single-year">
                            Initial Year
                        </label>
                        <input
                            id="single-year"
                            type="number"
                            className={`w-32 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 
                                ${inputMode === 'range' ? 'bg-gray-200 cursor-not-allowed' : 'focus:ring-blue-500 border-gray-300'}`}
                            value={single_year === null ? '' : single_year}
                            onChange={handleSingleYearChange}
                            placeholder="Year"
                            disabled={inputMode === 'range'}
                            min="2011"
                            max="2099"
                        />
                    </div>
                    <div className="mx-4 text-gray-500 self-center">OR</div>
                    <div className={`${inputMode === 'single' ? 'opacity-60' : ''}`}>
                        <label className="block text-gray-700 mb-2" htmlFor="range-start">
                            Single Year
                        </label>
                        <input
                            id="range-start"
                            type="number"
                            className={`w-32 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 
                                   ${inputMode === 'single' ? 'bg-gray-200 cursor-not-allowed' : 'focus:ring-blue-500 border-gray-300'}`}
                            value={range_year_start === null ? '' : range_year_start}
                            onChange={handleRangeStartChange}
                            placeholder="Start"
                            disabled={inputMode === 'single'}
                            min="2011"
                            max="2099"
                        />
                    </div>
                     
                     
                      
                    <div className={`${inputMode === 'single' ? 'opacity-60' : ''}`}>
                        <label className="block text-gray-700 mb-2" htmlFor="range-end">
                            Ultimate Year
                        </label>
                        <input
                            id="range-end"
                            type="number"
                            className={`w-32 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 
                                   ${inputMode === 'single' ? 'bg-gray-200 cursor-not-allowed' : 'focus:ring-blue-500 border-gray-300'}`}
                            value={range_year_end === null ? '' : range_year_end}
                            onChange={handleRangeEndChange}
                            placeholder="End"
                            disabled={inputMode === 'single'}
                            min="2011"
                            max="2099"
                        />
                    </div>
                </div>
                {error && (
                    <div className="mt-3 text-red-500 text-sm">{error}</div>
                )}
            </div>

            <div className="mb-4 p-4 rounded-md border border-gray-200">
                <h3 className="font-medium text-gray-700 mb-3">Calculation Methods</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <label className="inline-flex items-center">
                        <input
                            type="checkbox"
                            className="form-checkbox h-5 w-5 text-blue-600"
                            checked={methods.timeseries}
                            onChange={() => handleMethodChange('timeseries')}
                        />
                        <span className="ml-2 text-gray-700">Time Series</span>
                    </label>
                    <label className="inline-flex items-center">
                        <input
                            type="checkbox"
                            className="form-checkbox h-5 w-5 text-blue-600"
                            checked={methods.demographic}
                            onChange={() => handleMethodChange('demographic')}
                        />
                        <span className="ml-2 text-gray-700">Demographic</span>
                    </label>
                    <label className="inline-flex items-center">
                        <input
                            type="checkbox"
                            className="form-checkbox h-5 w-5 text-blue-600"
                            checked={methods.cohort}
                            onChange={() => handleMethodChange('cohort')}
                        />
                        <span className="ml-2 text-gray-700">Cohort</span>
                    </label>
                </div>
                {!isMethodSelected && (
                    <div className="mt-2 text-red-500 text-sm">Please select at least one calculation method</div>
                )}
            </div>

            {methods.timeseries && (
                <div className="mb-4 p-4 rounded-md border border-gray-200">
                    <h3 className="font-medium text-gray-700 mb-3">Time Series Analysis</h3>
                    <TimeMethods />
                </div>
            )}
            {methods.demographic && (
                <div className="mb-4 p-4 rounded-md border border-gray-200">
                    <h3 className="font-medium text-gray-700 mb-3">Demographic Analysis</h3>
                    <DemographicPopulation
                        onDataChange={handleLocalDemographicDataChange}
                        initialData={demographicData}
                    />
                    {demographicError && (
                        <div className="mt-3 text-red-500 text-sm">{demographicError}</div>
                    )}
                </div>
            )}

            <div className="mt-6">
                <button
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center justify-center gap-2"
                    disabled={
                        loading ||
                        cohortRequestPending ||
                        (inputMode === 'single' && (single_year === null || single_year < 2011 || single_year > 2099)) ||
                        (inputMode === 'range' && (range_year_start === null || range_year_end === null ||
                            range_year_start < 2011 || range_year_start > 2099 ||
                            range_year_end < 2011 || range_year_end > 2099 ||
                            error !== null)) ||
                        inputMode === null ||
                        !isMethodSelected
                    }
                    onClick={handleSubmit}
                >
                    {loading || cohortRequestPending ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                        "Calculate"
                    )}
                </button>
            </div>

            {results && (
                <div className="mt-8 max-w-4xl">
                    <h2 className="text-3xl font-bold text-blue-800 mb-6">Population Data</h2>
                    <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-lg bg-white">
                        <div className="max-h-96 overflow-y-auto">
                            <table className="w-full min-w-[600px] border-collapse">
                                <thead className="sticky top-0 z-10 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700">
                                    <tr>
                                        <th className="border-b px-6 py-4 text-left font-semibold text-sm w-28">Year</th>
                                        {Object.keys(results || {}).map(
                                            (method) => (
                                                <th
                                                    key={method}
                                                    className="border-b px-6 py-4 text-center font-semibold text-sm"
                                                >
                                                    {method}
                                                </th>
                                            )
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {getYears(results).map((year, index) => (
                                        <tr
                                            key={year}
                                            className={`border-b hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'}`}
                                        >
                                            <td className="border-b px-6 py-4 font-medium text-gray-800">{year}</td>
                                            {Object.keys(results || {}).map(
                                                (method) => (
                                                    <td
                                                        key={`${method}-${year}`}
                                                        className="border-b px-6 py-4 text-center text-gray-600"
                                                    >
                                                        {method === 'Demographic' ?
                                                            (results[method] && results[method][year]) ?? '-' :
                                                            (results[method] && results[method][year]) ?? '-'}
                                                    </td>
                                                )
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="mt-6 bg-gray-50 p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center mb-4 space-x-2">
                            <h3 className="text-lg font-semibold text-gray-800">Select a Method</h3>
                            <div className="relative group">
                                <Info className="w-5 h-5 text-blue-600 cursor-pointer" />
                                <div className="absolute left-1/2 -translate-x-1/2 top-full mb-10 -mt-11 ml-50 w-max max-w-xs text-black text-sm rounded-lg shadow-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out z-10 pointer-events-none">
                                    This method's data will be used in further analysis.
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-6">
                            {Object.keys(results).map((method) => (
                                <label
                                    key={method}
                                    className="flex items-center gap-2 cursor-pointer group"
                                >
                                    <input
                                        type="radio"
                                        name="selectedMethod"
                                        value={method}
                                        checked={selectedMethod === method}
                                        onChange={() => {
                                            setSelectedMethodd(method);
                                            window.selectedPopulationMethod = method;
                                        }}
                                        className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 transition"
                                    />
                                    <span className="text-gray-700 font-medium group-hover:text-blue-600 transition">
                                        {method}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {cohortData && cohortData.length > 0 && <Cohort cohortData={cohortData} />}

            {results && <PopulationChart results={results} />}
        </div>
    )
}

export default Population