import Analytics from "../models/Analytics.js";
import OrderBill from "../models/Order.js";

const buildRoleBasedQuery = (userRole, userId, baseQuery = {}) => {
  if (userRole === "FRANCHISE_ADMIN") {
    return { ...baseQuery, generatedBy: userId };
  }
  
  return baseQuery;
};


const getDateRange = (period) => {
  const now = new Date();
  let startDate, endDate;

  switch (period) {
    case "daily":
    case "today":
      startDate = new Date(now.setHours(0, 0, 0, 0));
      endDate = new Date(now.setHours(23, 59, 59, 999));
      break;

    case "7days":
    case "week":
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;

    case "monthly":
    case "month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;

    case "yearly":
    case "year":
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;

    default:
      startDate = new Date(now.setHours(0, 0, 0, 0));
      endDate = new Date(now.setHours(23, 59, 59, 999));
  }

  return { startDate, endDate };
};


const calculateAnalytics = (orders) => {
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;


  const cashOrders = orders.filter((o) => o.paymentMethod === "CASH").length;
  const onlineOrders = orders.filter((o) => o.paymentMethod === "ONLINE").length;
  const cashRevenue = orders
    .filter((o) => o.paymentMethod === "CASH")
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const onlineRevenue = orders
    .filter((o) => o.paymentMethod === "ONLINE")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  
  const dineInOrders = orders.filter((o) => o.orderType === "DINE_IN").length;
  const takeawayOrders = orders.filter((o) => o.orderType === "TAKEAWAY").length;
  const dineInRevenue = orders
    .filter((o) => o.orderType === "DINE_IN")
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const takeawayRevenue = orders
    .filter((o) => o.orderType === "TAKEAWAY")
    .reduce((sum, o) => sum + o.totalAmount, 0);


  const itemCount = {};
  orders.forEach((order) => {
    order.items.forEach((item) => {
      const foodName = item.foodName;
      if (!itemCount[foodName]) {
        itemCount[foodName] = {
          name: foodName,
          quantity: 0,
          revenue: 0,
        };
      }
      itemCount[foodName].quantity += item.quantity;
      itemCount[foodName].revenue += item.subtotal;
    });
  });

  const popularItems = Object.values(itemCount)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  const topRevenueItems = Object.values(itemCount)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  return {
    totalOrders,
    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
    averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
    paymentMethods: {
      cash: { count: cashOrders, revenue: parseFloat(cashRevenue.toFixed(2)) },
      online: { count: onlineOrders, revenue: parseFloat(onlineRevenue.toFixed(2)) },
    },
    orderTypes: {
      dineIn: { count: dineInOrders, revenue: parseFloat(dineInRevenue.toFixed(2)) },
      takeaway: { count: takeawayOrders, revenue: parseFloat(takeawayRevenue.toFixed(2)) },
    },
    popularItems,
    topRevenueItems,
  };
};


export const getAnalytics = async (req, res) => {
  try {
    const { period = "today" } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    const { startDate, endDate } = getDateRange(period);

    const query = buildRoleBasedQuery(userRole, userId, {
      paidAt: { $gte: startDate, $lte: endDate },
    });

    const orders = await OrderBill.find(query)
      .populate("generatedBy", "name email franchiseId")
      .populate("items.foodId", "name category")
      .sort({ paidAt: -1 });

    const analytics = calculateAnalytics(orders);

    
    let trends = [];
    if (period === "today" || period === "daily") {
      trends = await getDailyTrends(query, 1);
    } else if (period === "7days" || period === "week") {
      trends = await getDailyTrends(query, 7);
    } else if (period === "monthly" || period === "month") {
      trends = await getDailyTrends(query, 30);
    } else if (period === "yearly" || period === "year") {
      trends = await getMonthlyTrends(query);
    }

    console.log(`📊 Analytics for ${period}:`, {
      ordersCount: orders.length,
      trendsCount: trends.length,
      totalRevenue: analytics.totalRevenue
    });

    res.status(200).json({
      success: true,
      period,
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      analytics,
      trends,
      role: userRole,
    });
  } catch (error) {
    console.error("❌ Get Analytics Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch analytics",
      error: error.message,
    });
  }
};


const getDailyTrends = async (baseQuery, days) => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (days - 1));
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  const { paidAt, ...queryWithoutDate } = baseQuery;
  
  const query = {
    ...queryWithoutDate,
    paidAt: { $gte: startDate, $lte: endDate },
  };

  console.log(`📅 Fetching trends for ${days} days:`, {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    query
  });

  const orders = await OrderBill.find(query);
  
  console.log(`📦 Found ${orders.length} orders for trends`);


  const dailyData = {};
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];
    dailyData[dateStr] = {
      date: dateStr,
      revenue: 0,
      orders: 0,
      cash: 0,
      online: 0,
    };
  }

  orders.forEach((order) => {
    const dateStr = order.paidAt.toISOString().split("T")[0];
    if (dailyData[dateStr]) {
      dailyData[dateStr].revenue += order.totalAmount;
      dailyData[dateStr].orders += 1;
      if (order.paymentMethod === "CASH") {
        dailyData[dateStr].cash += order.totalAmount;
      } else {
        dailyData[dateStr].online += order.totalAmount;
      }
    }
  });

  return Object.values(dailyData)
    .map((day) => ({
      ...day,
      revenue: parseFloat(day.revenue.toFixed(2)),
      cash: parseFloat(day.cash.toFixed(2)),
      online: parseFloat(day.online.toFixed(2)),
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
};


const getMonthlyTrends = async (baseQuery) => {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), 0, 1);
  const endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

  const { paidAt, ...queryWithoutDate } = baseQuery;
  
  const query = {
    ...queryWithoutDate,
    paidAt: { $gte: startDate, $lte: endDate },
  };

  console.log(`📅 Fetching yearly trends:`, {
    year: now.getFullYear(),
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  });

  const orders = await OrderBill.find(query);
  
  console.log(`📦 Found ${orders.length} orders for yearly trends`);


  const monthlyData = {};
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  for (let i = 0; i < 12; i++) {
    monthlyData[i] = {
      month: monthNames[i],
      monthNumber: i + 1,
      revenue: 0,
      orders: 0,
      cash: 0,
      online: 0,
    };
  }


  orders.forEach((order) => {
    const month = order.paidAt.getMonth();
    monthlyData[month].revenue += order.totalAmount;
    monthlyData[month].orders += 1;
    if (order.paymentMethod === "CASH") {
      monthlyData[month].cash += order.totalAmount;
    } else {
      monthlyData[month].online += order.totalAmount;
    }
  });

  return Object.values(monthlyData).map((month) => ({
    ...month,
    revenue: parseFloat(month.revenue.toFixed(2)),
    cash: parseFloat(month.cash.toFixed(2)),
    online: parseFloat(month.online.toFixed(2)),
  }));
};


export const generateDailyAnalytics = async (req, res) => {
  try {
    const { date } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date is required",
      });
    }

    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

 
    const orderQuery = buildRoleBasedQuery(userRole, userId, {
      paidAt: { $gte: startOfDay, $lte: endOfDay },
    });

  
    const orders = await OrderBill.find(orderQuery).populate("items.foodId");

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No orders found for the specified date",
      });
    }


    const analytics = calculateAnalytics(orders);

    const existingAnalytics = await Analytics.findOne({
      analyticsBy: userId,
      date: startOfDay,
    });

    let savedAnalytics;
    if (existingAnalytics) {
     
      savedAnalytics = await Analytics.findByIdAndUpdate(
        existingAnalytics._id,
        {
          totalOrders: analytics.totalOrders,
          totalRevenue: analytics.totalRevenue,
          popularItems: analytics.popularItems,
        },
        { new: true }
      ).populate("analyticsBy", "name email franchiseId");
    } else {
   
      savedAnalytics = await Analytics.create({
        analyticsBy: userId,
        date: startOfDay,
        totalOrders: analytics.totalOrders,
        totalRevenue: analytics.totalRevenue,
        popularItems: analytics.popularItems,
      });
      savedAnalytics = await Analytics.findById(savedAnalytics._id).populate(
        "analyticsBy",
        "name email franchiseId"
      );
    }

    res.status(201).json({
      success: true,
      message: "Analytics generated successfully",
      data: savedAnalytics,
    });
  } catch (error) {
    console.error("❌ Generate Analytics Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to generate analytics",
      error: error.message,
    });
  }
};

export const getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { period = "today" } = req.query;

    const { startDate, endDate } = getDateRange(period);

  
    const query = buildRoleBasedQuery(userRole, userId, {
      paidAt: { $gte: startDate, $lte: endDate },
    });

    // Fetch orders
    const orders = await OrderBill.find(query)
      .populate("generatedBy", "name email")
      .sort({ paidAt: -1 });

    // Calculate analytics
    const analytics = calculateAnalytics(orders);

    // Recent orders (last 10)
    const recentOrders = orders.slice(0, 10).map((order) => ({
      billNumber: order.billNumber,
      customerName: order.customerDetails.name,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      orderType: order.orderType,
      paidAt: order.paidAt,
    }));

    res.status(200).json({
      success: true,
      period,
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      summary: {
        totalOrders: analytics.totalOrders,
        totalRevenue: analytics.totalRevenue,
        averageOrderValue: analytics.averageOrderValue,
      },
      breakdown: {
        paymentMethods: analytics.paymentMethods,
        orderTypes: analytics.orderTypes,
      },
      topSellingItems: analytics.popularItems.slice(0, 5),
      recentOrders,
      role: userRole,
    });
  } catch (error) {
    console.error("❌ Dashboard Summary Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard summary",
      error: error.message,
    });
  }
};

/**
 * Get revenue trends with flexible period
 */
export const getRevenueTrends = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { period = "7days", days } = req.query;

    let trends = [];
    let dateRange = {};

    if (days) {
      // Custom days
      const numDays = parseInt(days);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (numDays - 1));
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      const query = buildRoleBasedQuery(userRole, userId, {
        paidAt: { $gte: startDate, $lte: endDate },
      });

      trends = await getDailyTrends(query, numDays);
      dateRange = { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
    } else {
      // Predefined periods
      const { startDate, endDate } = getDateRange(period);
      const query = buildRoleBasedQuery(userRole, userId, {
        paidAt: { $gte: startDate, $lte: endDate },
      });

      if (period === "yearly" || period === "year") {
        trends = await getMonthlyTrends(query);
      } else if (period === "monthly" || period === "month") {
        trends = await getDailyTrends(query, 30);
      } else {
        // daily or 7days
        const numDays = period === "daily" || period === "today" ? 1 : 7;
        trends = await getDailyTrends(query, numDays);
      }

      dateRange = { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
    }

    res.status(200).json({
      success: true,
      period: days ? `${days}days` : period,
      dateRange,
      trends,
      role: userRole,
    });
  } catch (error) {
    console.error("❌ Revenue Trends Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch revenue trends",
      error: error.message,
    });
  }
};

/**
 * Get category-wise sales analysis
 */
export const getCategorySales = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { period = "today" } = req.query;

    const { startDate, endDate } = getDateRange(period);

    // Build query based on role
    const query = buildRoleBasedQuery(userRole, userId, {
      paidAt: { $gte: startDate, $lte: endDate },
    });

    const orders = await OrderBill.find(query).populate("items.foodId");

    // Group by category
    const categoryData = {};

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const category = item.foodId?.category || "UNKNOWN";
        if (!categoryData[category]) {
          categoryData[category] = {
            category,
            quantity: 0,
            revenue: 0,
            orders: new Set(),
          };
        }
        categoryData[category].quantity += item.quantity;
        categoryData[category].revenue += item.subtotal;
        categoryData[category].orders.add(order._id.toString());
      });
    });

    const categorySales = Object.values(categoryData)
      .map((cat) => ({
        category: cat.category,
        quantity: cat.quantity,
        revenue: parseFloat(cat.revenue.toFixed(2)),
        orderCount: cat.orders.size,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    res.status(200).json({
      success: true,
      period,
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      categorySales,
      role: userRole,
    });
  } catch (error) {
    console.error("❌ Category Sales Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch category sales",
      error: error.message,
    });
  }
};
