import { useEffect, useState } from "react";
import API from "../services/api";
import CategoryPieChart from "../components/CategoryPieChart";
import MonthlyBarChart from "../components/MonthlyBarChart";

function Dashboard() {
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await API.get("/expenses/analytics");
      setAnalytics(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  if (!analytics) return <h2>Loading...</h2>;

  return (
    <div style={{ padding: 40 }}>
      <h1>Finsight Pro Dashboard</h1>

      <h2>Total Expense: ₹{analytics.totalExpense}</h2>

      <h3>Category Breakdown</h3>
<CategoryPieChart data={analytics.categoryBreakdown} />

<h3>Monthly Trend</h3>
<MonthlyBarChart data={analytics.monthlyTrend} />
    </div>
  );
}

export default Dashboard;

