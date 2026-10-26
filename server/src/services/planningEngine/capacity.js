/**
 * Splits production volume across consecutive days if it exceeds maximum daily line capacity,
 * calculating utilization and production hours required.
 */
export function scheduleCapacity({
  quantity = 0,
  productionRatePerHour = 50,
  operatingHoursPerDay = 10,
  startDate = new Date(),
  deliveryDueDate = null
}) {
  const dailyCapacity = productionRatePerHour * operatingHoursPerDay;
  if (quantity <= 0 || dailyCapacity <= 0) {
    return {
      dailyCapacity,
      daysNeeded: 0,
      totalHours: 0,
      dailySchedules: [],
      isWithinDeliveryDeadline: true
    };
  }

  let remaining = quantity;
  let dayIndex = 0;
  const dailySchedules = [];

  while (remaining > 0) {
    const scheduledQty = Math.min(remaining, dailyCapacity);
    const hoursRequired = Number((scheduledQty / productionRatePerHour).toFixed(2));
    const utilization = Number(((scheduledQty / dailyCapacity) * 100).toFixed(1));

    const scheduleDate = new Date(startDate);
    scheduleDate.setDate(scheduleDate.getDate() + dayIndex);

    dailySchedules.push({
      dayIndex: dayIndex + 1,
      date: scheduleDate,
      quantity: scheduledQty,
      hoursRequired,
      capacityUtilizationPercent: utilization
    });

    remaining -= scheduledQty;
    dayIndex++;
  }

  const completionDate = dailySchedules[dailySchedules.length - 1]?.date;
  const isWithinDeliveryDeadline = deliveryDueDate
    ? new Date(completionDate) <= new Date(deliveryDueDate)
    : true;

  const totalHours = Number((quantity / productionRatePerHour).toFixed(2));

  return {
    dailyCapacity,
    daysNeeded: dailySchedules.length,
    totalHours,
    dailySchedules,
    completionDate,
    isWithinDeliveryDeadline
  };
}