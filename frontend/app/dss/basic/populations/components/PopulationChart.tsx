'use client'

import { Line, Bar } from "react-chartjs-2";
import { 
  Chart as ChartJS, 
  LineElement, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  Tooltip, 
  Legend,
  BarElement
} from "chart.js";
import { useMemo } from "react";

// Register Chart.js components
ChartJS.register(
  LineElement, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  Tooltip, 
  Legend,
  BarElement
);

const processData = (results: any) => {
    if (!results) return { labels: [], datasets: [] };

    const allYears = new Set<number>();
    const models = Object.keys(results);

    models.forEach((model) => {
        Object.keys(results[model]).forEach((year) => {
            const yearNum = Number(year);
            if (yearNum !== 2011) allYears.add(yearNum); // Exclude 2011
        });
    });

    let yearsArray = Array.from(allYears).sort((a, b) => a - b);

    // If years are more than 10, show in 5-year intervals
    const interval = yearsArray.length > 10 ? 5 : 1;
    yearsArray = yearsArray.filter(year => (year - yearsArray[0]) % interval === 0);

    return {
        labels: yearsArray.map(String), // X-axis labels (years)
        datasets: models.map((model, index) => ({
            label: model,
            data: yearsArray.map(year => results[model][year] || null),
            borderColor: ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#410445"][index % 5], // Color cycle
            backgroundColor: yearsArray.length <= 2 
                ? ["rgba(136, 132, 216, 0.7)", "rgba(130, 202, 157, 0.7)", "rgba(255, 198, 88, 0.7)", "rgba(255, 115, 0, 0.7)", "rgba(65, 4, 69, 0.7)"][index % 5]
                : "rgba(0, 0, 0, 0)", // Transparent fill for line chart, color for bar chart
            tension: 0.4, // Smooth curve
        }))
    };
};

const PopulationChart = ({ results }: { results: any }) => {
    const chartData = useMemo(() => processData(results), [results]);
    
    // Check if we have only two years in the data
    const hasOnlyTwoYears = chartData.labels.length <= 2;

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: { title: { display: true, text: "Year" } },
            y: { title: { display: true, text: "Population" } }
        }
    };

    return (
        <div className="mt-6">
            <h2 className="text-lg font-semibold mb-4">
                Population {hasOnlyTwoYears ? "Comparison" : "Projection"}
            </h2>
            <div style={{ height: "400px" }}>
                {hasOnlyTwoYears ? (
                    <Bar data={chartData} options={options} />
                ) : (
                    <Line data={chartData} options={options} />
                )}
            </div>
        </div>
    );
};

export default PopulationChart;