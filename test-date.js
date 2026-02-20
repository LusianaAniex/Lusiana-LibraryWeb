const { addDays, format } = require('date-fns');

const borrowDate = "2026-02-20";
for (let duration of [3, 5, 10]) {
  const returnDate = addDays(new Date(borrowDate), duration);
  console.log(`Duration ${duration}:`, format(returnDate, 'd MMMM yyyy'));
}
