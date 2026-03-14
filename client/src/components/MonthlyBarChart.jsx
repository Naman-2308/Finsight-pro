import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

function MonthlyBarChart({ data }) {

  const chartData = {
    labels: data.map(item => item.label),
    datasets: [
      {
        label: "Monthly Expense",
        data: data.map(item => item.total),
      }
    ]
  };

  return (
    <div style={{width:"500px"}}>
      <Bar data={chartData} />
    </div>
  );
}

export default MonthlyBarChart;

