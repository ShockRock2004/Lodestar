// SQL — 32-day, self-paced plan (no calendar dates, just Day 1..32).
// Phase 1 (Days 1–10): the Coddy.tech SQLite journey (99 lessons across
//   Fundamentals + Beyond the Basics) — one day allotted per ~10 lessons.
// Phase 2 (Days 11–27): LeetCode's "Top SQL 50" study plan, exactly 3
//   problems/day (the last day carries the 2 leftover), in the plan's own order.
// Phase 3 (Days 28–32): LeetCode's Database Quest, 1 of its 5 levels/day.
const CODDY_URL = 'https://coddy.tech/journeys/sqlite/sections'
const QUEST_URL = 'https://leetcode.com/quest/database-quest/'
const LC = (slug) => `https://leetcode.com/problems/${slug}/`

// ── Phase 1: SQLite journey — Day n of 10 ──
const C = (n) => ({
  n, phase: 'SQLite Journey', title: `SQLite Journey — Day ${n}`,
  focus: 'Coddy.tech SQLite path: Fundamentals → Beyond the Basics (99 lessons total).',
  items: [{ key: `c${n}`, title: `Continue the SQLite journey (Day ${n} of 10)`, type: 'course', url: CODDY_URL, hours: 1 }],
})

// ── Phase 2: LeetCode Top SQL 50 — [problem #, title, slug, difficulty] in study-plan order ──
const SQL50 = [
  [1757, 'Recyclable and Low Fat Products', 'recyclable-and-low-fat-products', 'easy'],
  [584, 'Find Customer Referee', 'find-customer-referee', 'easy'],
  [595, 'Big Countries', 'big-countries', 'easy'],
  [1148, 'Article Views I', 'article-views-i', 'easy'],
  [1683, 'Invalid Tweets', 'invalid-tweets', 'easy'],
  [1378, 'Replace Employee ID With The Unique Identifier', 'replace-employee-id-with-the-unique-identifier', 'easy'],
  [1068, 'Product Sales Analysis I', 'product-sales-analysis-i', 'easy'],
  [1581, 'Customer Who Visited but Did Not Make Any Transactions', 'customer-who-visited-but-did-not-make-any-transactions', 'easy'],
  [197, 'Rising Temperature', 'rising-temperature', 'easy'],
  [1661, 'Average Time of Process per Machine', 'average-time-of-process-per-machine', 'easy'],
  [577, 'Employee Bonus', 'employee-bonus', 'easy'],
  [1280, 'Students and Examinations', 'students-and-examinations', 'easy'],
  [570, 'Managers with at Least 5 Direct Reports', 'managers-with-at-least-5-direct-reports', 'med'],
  [1934, 'Confirmation Rate', 'confirmation-rate', 'med'],
  [620, 'Not Boring Movies', 'not-boring-movies', 'easy'],
  [1251, 'Average Selling Price', 'average-selling-price', 'easy'],
  [1075, 'Project Employees I', 'project-employees-i', 'easy'],
  [1633, 'Percentage of Users Attended a Contest', 'percentage-of-users-attended-a-contest', 'easy'],
  [1211, 'Queries Quality and Percentage', 'queries-quality-and-percentage', 'easy'],
  [1193, 'Monthly Transactions I', 'monthly-transactions-i', 'med'],
  [1174, 'Immediate Food Delivery II', 'immediate-food-delivery-ii', 'med'],
  [550, 'Game Play Analysis IV', 'game-play-analysis-iv', 'med'],
  [2356, 'Number of Unique Subjects Taught by Each Teacher', 'number-of-unique-subjects-taught-by-each-teacher', 'easy'],
  [1141, 'User Activity for the Past 30 Days I', 'user-activity-for-the-past-30-days-i', 'easy'],
  [1070, 'Product Sales Analysis III', 'product-sales-analysis-iii', 'med'],
  [596, 'Classes More Than 5 Students', 'classes-more-than-5-students', 'easy'],
  [1729, 'Find Followers Count', 'find-followers-count', 'easy'],
  [619, 'Biggest Single Number', 'biggest-single-number', 'easy'],
  [1045, 'Customers Who Bought All Products', 'customers-who-bought-all-products', 'med'],
  [1731, 'The Number of Employees Which Report to Each Employee', 'the-number-of-employees-which-report-to-each-employee', 'easy'],
  [1789, 'Primary Department for Each Employee', 'primary-department-for-each-employee', 'easy'],
  [610, 'Triangle Judgement', 'triangle-judgement', 'easy'],
  [180, 'Consecutive Numbers', 'consecutive-numbers', 'med'],
  [1164, 'Product Price at a Given Date', 'product-price-at-a-given-date', 'med'],
  [1204, 'Last Person to Fit in the Bus', 'last-person-to-fit-in-the-bus', 'med'],
  [1907, 'Count Salary Categories', 'count-salary-categories', 'med'],
  [1978, 'Employees Whose Manager Left the Company', 'employees-whose-manager-left-the-company', 'easy'],
  [626, 'Exchange Seats', 'exchange-seats', 'med'],
  [1341, 'Movie Rating', 'movie-rating', 'med'],
  [1321, 'Restaurant Growth', 'restaurant-growth', 'med'],
  [602, 'Friend Requests II: Who Has the Most Friends', 'friend-requests-ii-who-has-the-most-friends', 'med'],
  [585, 'Investments in 2016', 'investments-in-2016', 'med'],
  [185, 'Department Top Three Salaries', 'department-top-three-salaries', 'hard'],
  [1667, 'Fix Names in a Table', 'fix-names-in-a-table', 'easy'],
  [1527, 'Patients With a Condition', 'patients-with-a-condition', 'easy'],
  [196, 'Delete Duplicate Emails', 'delete-duplicate-emails', 'easy'],
  [176, 'Second Highest Salary', 'second-highest-salary', 'med'],
  [1484, 'Group Sold Products By The Date', 'group-sold-products-by-the-date', 'easy'],
  [1327, 'List the Products Ordered in a Period', 'list-the-products-ordered-in-a-period', 'easy'],
  [1517, 'Find Users With Valid E-Mails', 'find-users-with-valid-e-mails', 'easy'],
]

function chunk3(arr) {
  const out = []
  for (let i = 0; i < arr.length; i += 3) out.push(arr.slice(i, i + 3))
  return out
}

const Q50 = (n, dayNo, probs) => ({
  n, phase: 'LeetCode SQL 50', title: `SQL 50 — Day ${dayNo} of 17`,
  focus: '3 problems/day from LeetCode’s Top SQL 50 study plan, in plan order.',
  items: probs.map((p, i) => ({ key: `q${n}.${i + 1}`, title: `${p[0]}. ${p[1]}`, type: p[3], url: LC(p[2]), hours: 0.5 })),
})

// ── Phase 3: Database Quest — Level n of 5 ──
const DQ = (n, level) => ({
  n, phase: 'Database Quest', title: `Database Quest — Level ${level}`,
  focus: 'leetcode.com/quest/database-quest — one level per day.',
  items: [{ key: `dq${n}`, title: `Complete Level ${level} of 5`, type: 'quest', url: QUEST_URL, hours: 1 }],
})

export const SQL_DAYS = [
  ...Array.from({ length: 10 }, (_, i) => C(i + 1)),
  ...chunk3(SQL50).map((probs, i) => Q50(11 + i, i + 1, probs)),
  ...Array.from({ length: 5 }, (_, i) => DQ(28 + i, i + 1)),
]

export const SQL_PHASES = ['SQLite Journey', 'LeetCode SQL 50', 'Database Quest']
export const SQL_TOTAL_DAYS = SQL_DAYS.length
export const SQL_ALL_ITEMS = SQL_DAYS.flatMap((d) => d.items)
export const SQL_TOTAL_ITEMS = SQL_ALL_ITEMS.length

export const dayComplete = (day, doneMap) => day.items.length > 0 && day.items.every((it) => doneMap[it.key])
export function currentDayIndex(doneMap) {
  const i = SQL_DAYS.findIndex((d) => !dayComplete(d, doneMap))
  return i === -1 ? SQL_DAYS.length : i + 1
}
export function sqlPct(doneMap) {
  const done = SQL_ALL_ITEMS.filter((it) => doneMap[it.key]).length
  return { doneItems: done, totalItems: SQL_TOTAL_ITEMS, pct: SQL_TOTAL_ITEMS ? Math.round((done / SQL_TOTAL_ITEMS) * 100) : 0 }
}
export function phaseStats(doneMap) {
  return SQL_PHASES.map((ph) => {
    const its = SQL_DAYS.filter((d) => d.phase === ph).flatMap((d) => d.items)
    const d = its.filter((it) => doneMap[it.key]).length
    return { phase: ph, done: d, total: its.length, pct: its.length ? Math.round((d / its.length) * 100) : 0 }
  })
}
export function doneDaysCount(doneMap) {
  return SQL_DAYS.filter((d) => dayComplete(d, doneMap)).length
}
export const TYPE_LABEL = { course: 'Course', quest: 'Level', easy: 'Easy', med: 'Medium', hard: 'Hard' }
export const DIFFICULTY_TYPES = new Set(['easy', 'med', 'hard'])
