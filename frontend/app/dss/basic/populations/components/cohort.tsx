import React from 'react';

interface CohortAgeGroup {
    male: number;
    female: number;
    total: number;
}

interface CohortData {
    year: number;
    data: {
        [ageGroup: string]: CohortAgeGroup;
    };
}

interface CohortProps {
    cohortData: CohortData[];
}

const Cohort: React.FC<CohortProps> = ({ cohortData }) => {
    // Sort age groups by their numeric value for better display
    const sortAgeGroups = (ageGroups: string[]): string[] => {
        return ageGroups.sort((a, b) => {
            const aNum = parseInt(a.split('-')[0]);
            const bNum = parseInt(b.split('-')[0]);
            return aNum - bNum;
        });
    };

    // If no data is found, don't render anything
    if (!cohortData || cohortData.length === 0) {
        return null;
    }

    // Remove duplicate years - keep only the first occurrence of each year
    const uniqueCohortData = cohortData.reduce((acc: CohortData[], current) => {
        const existingIndex = acc.findIndex(item => item.year === current.year);
        
        if (existingIndex === -1) {
            // If year doesn't exist, add it
            acc.push(current);
        }
        // If year already exists, skip it (don't add or merge)
        
        return acc;
    }, []);

    // Sort by year
    const sortedCohortData = uniqueCohortData.sort((a, b) => a.year - b.year);

    // Get all unique age groups across all years
    const allAgeGroups = Array.from(
        new Set(
            sortedCohortData.flatMap(data => Object.keys(data.data))
        )
    );
    const sortedAgeGroups = sortAgeGroups(allAgeGroups);

    return (
        <div className="mt-8 max-w-7xl">
            <h2 className="text-3xl font-bold text-blue-800 mb-6">
                Cohort Analysis {sortedCohortData.length === 1 ? `(${sortedCohortData[0].year})` : ''}
            </h2>
            
            <div className="table-container overflow-x-auto border border-gray-200 rounded-xl shadow-lg bg-white">
                <table className="w-full border-collapse">
                    <thead className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 sticky top-0">
                        <tr>
                            <th className="border-b px-6 py-4 text-left font-semibold text-sm sticky left-0 bg-gray-100 z-10">Age Group</th>
                            {sortedCohortData.map((data, index) => (
                                <th 
                                    key={data.year} 
                                    colSpan={3} 
                                    className={`border-b px-6 py-4 text-center font-semibold text-sm ${
                                        index < sortedCohortData.length - 1 ? 'border-r border-gray-300' : ''
                                    }`}
                                >
                                    {data.year}
                                </th>
                            ))}
                        </tr>
                        <tr>
                            <th className="border-b px-6 py-4 text-left font-semibold text-sm sticky left-0 bg-gray-100 z-10"></th>
                            {sortedCohortData.map((data, index) => (
                                <React.Fragment key={`headers-${data.year}`}>
                                    <th className="border-b px-6 py-4 text-center font-semibold text-sm text-blue-600">
                                        Male
                                    </th>
                                    <th className="border-b px-6 py-4 text-center font-semibold text-sm text-pink-600">
                                        Female
                                    </th>
                                    <th className={`border-b px-6 py-4 text-center font-semibold text-sm text-gray-700 ${
                                        index < sortedCohortData.length - 1 ? 'border-r border-gray-300' : ''
                                    }`}>
                                        Total
                                    </th>
                                </React.Fragment>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedAgeGroups.map((ageGroup, index) => (
                            <tr
                                key={ageGroup}
                                className={`border-b hover:bg-gray-50 transition-colors ${
                                    index % 2 === 0 ? "bg-gray-50/50" : "bg-white"
                                }`}
                            >
                                <td className="border-b px-6 py-4 font-medium text-gray-800 sticky left-0 bg-inherit z-10">{ageGroup}</td>
                                {sortedCohortData.map((data, dataIndex) => (
                                    <React.Fragment key={`data-${data.year}-${ageGroup}`}>
                                        <td className="border-b px-6 py-4 text-center text-blue-600 font-medium">
                                            {data.data[ageGroup]?.male?.toLocaleString() ?? '-'}
                                        </td>
                                        <td className="border-b px-6 py-4 text-center text-pink-600 font-medium">
                                            {data.data[ageGroup]?.female?.toLocaleString() ?? '-'}
                                        </td>
                                        <td className={`border-b px-6 py-4 text-center text-gray-700 font-semibold ${
                                            dataIndex < sortedCohortData.length - 1 ? 'border-r border-gray-300' : ''
                                        }`}>
                                            {data.data[ageGroup]?.total?.toLocaleString() ?? '-'}
                                        </td>
                                    </React.Fragment>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {/* Summary section for single year */}
            {sortedCohortData.length === 1 && (
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">Summary</h3>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <div className="text-2xl font-bold text-blue-600">
                                {Object.values(sortedCohortData[0].data)
                                    .reduce((sum, group) =>  (group.male || 0), 0)
                                    .toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-600">Total Male</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-pink-600">
                                {Object.values(sortedCohortData[0].data)
                                    .reduce((sum, group) =>  (group.female || 0), 0)
                                    .toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-600">Total Female</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-700">
                                {Object.values(sortedCohortData[0].data)
                                    .reduce((sum, group) =>  (group.total || 0), 0)
                                    .toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-600">Total Population</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cohort;