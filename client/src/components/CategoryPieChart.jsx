import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

function CategoryPieChart({ data }) {

  const chartData = {
    labels: data.map(item => item.category),
    datasets: [
      {
        label: "Expenses",
        data: data.map(item => item.total),
      }
    ]
  };

  return (
    <div style={{width:"400px"}}>
      <Pie data={chartData} />
    </div>
  );
}

export default CategoryPieChart;
