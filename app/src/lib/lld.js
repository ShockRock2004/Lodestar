// Low Level Design — 46-day plan (Oct 1 → Nov 15, 2026).
// THEORY (Oct 1–31): every lesson from the AlgoMaster LLD course in its EXACT course order,
//   from Course Introduction through the "LLD Interview Tips" module (algomaster.io/learn/lld).
// QUESTIONS (Nov 1–15): all 33 problems from github.com/ashishps1/awesome-low-level-design, 2/day
//   (three light days carry a 3rd) — clustered by theme, warm-ups first, hardest last.
import { setStore } from './store'

const A = (s) => `https://algomaster.io/learn/lld/${s}`
const P = (f) => `https://github.com/ashishps1/awesome-low-level-design/blob/main/problems/${f}.md`

// theory day: lessons = [title, slug, kind?('concept'|'pattern')]
const T = (n, phase, title, focus, lessons) => ({
  n, phase, title, focus,
  items: lessons.map((l, i) => ({ key: `${n}.${i + 1}`, title: l[0], type: l[2] || 'concept', url: A(l[1]), hours: 0.5 })),
})
// question day: probs = [name, file, hours?]
const Q = (n, title, focus, tag, probs) => ({
  n, phase: 'Questions', title, focus, tag,
  items: probs.map((p, i) => ({ key: `${n}.${i + 1}`, title: `Design ${p[0]}`, type: 'problem', url: P(p[1]), hours: p[2] || 1.5 })),
})

export const LLD_DAYS = [
  // ── THEORY · exact AlgoMaster course order (Oct 1–31) ──
  T(1, 'OOP Foundations', 'Course Intro & LLD Basics', 'What LLD is and how it’s tested.', [
    ['Course Introduction', 'course-introduction'], ['Course Roadmap', 'course-roadmap'], ['What is LLD?', 'what-is-lld'],
  ]),
  T(2, 'OOP Foundations', 'LLD vs HLD · Interview Types', 'Where LLD sits and the interview formats.', [
    ['LLD vs HLD', 'lld-vs-hld'], ['Types of LLD Interviews', 'lld-interview-types'],
  ]),
  T(3, 'OOP Foundations', 'OOP · Classes, Enums, Interfaces', 'The building blocks.', [
    ['Classes and Objects', 'classes-and-objects'], ['Enums', 'enums'], ['Interfaces', 'interfaces'],
  ]),
  T(4, 'OOP Foundations', 'OOP · Encapsulation & Abstraction', 'Hiding state; exposing intent.', [
    ['Encapsulation', 'encapsulation'], ['Abstraction', 'abstraction'],
  ]),
  T(5, 'OOP Foundations', 'OOP · Inheritance & Polymorphism', 'Reuse and substitutability.', [
    ['Inheritance', 'inheritance'], ['Polymorphism', 'polymorphism'],
  ]),
  T(6, 'OOP Foundations', 'Class Relationships I', 'Model "has-a" vs "owns-a" correctly.', [
    ['Association', 'association'], ['Aggregation', 'aggregation'], ['Composition', 'composition'],
  ]),
  T(7, 'OOP Foundations', 'Class Relationships II', 'Dependencies and realization.', [
    ['Dependency', 'dependency'], ['Realization', 'realization'],
  ]),
  T(8, 'Design Principles', 'Principles · DRY, KISS, YAGNI', 'Keep designs lean.', [
    ['DRY Principle', 'dry'], ['KISS Principle', 'kiss'], ['YAGNI Principle', 'yagni'],
  ]),
  T(9, 'Design Principles', 'Principles · Demeter & SoC', 'Loose coupling by construction.', [
    ['Law of Demeter', 'lod'], ['Separation of Concerns', 'soc'],
  ]),
  T(10, 'Design Principles', 'Principles · Coupling & Composing', 'Cohesion, coupling, composition-over-inheritance.', [
    ['Coupling and Cohesion', 'coupling-and-cohesion'], ['Composing Objects Principle', 'composing-objects'],
  ]),
  T(11, 'Design Principles', 'SOLID I — SRP & OCP', 'The two that drive most decisions.', [
    ['Single Responsibility Principle', 'srp'], ['Open/Closed Principle', 'ocp'],
  ]),
  T(12, 'Design Principles', 'SOLID II — LSP, ISP, DIP', 'Substitutability, lean interfaces, inversion.', [
    ['Liskov Substitution Principle', 'lsp'], ['Interface Segregation Principle', 'isp'], ['Dependency Inversion Principle', 'dip'],
  ]),
  T(13, 'UML & Patterns', 'UML I · Class & Use Case', 'Draw the design.', [
    ['Class Diagram', 'class-diagram'], ['Use Case Diagram', 'use-case-diagram'],
  ]),
  T(14, 'UML & Patterns', 'UML II · Sequence, Activity, State', 'Behavior over time.', [
    ['Sequence Diagram', 'sequence-diagram'], ['Activity Diagram', 'activity-diagram'], ['State Machine Diagram', 'state-machine-diagram'],
  ]),
  T(15, 'UML & Patterns', 'Patterns · Intro + Singleton', 'Design patterns begin.', [
    ['Intro to Design Patterns', 'design-patterns'], ['Singleton', 'singleton', 'pattern'],
  ]),
  T(16, 'UML & Patterns', 'Creational · Builder & Factory Method', 'Constructing objects.', [
    ['Builder', 'builder', 'pattern'], ['Factory Method', 'factory-method', 'pattern'],
  ]),
  T(17, 'UML & Patterns', 'Creational · Abstract Factory & Prototype', 'Families and clones.', [
    ['Abstract Factory', 'abstract-factory', 'pattern'], ['Prototype', 'prototype', 'pattern'],
  ]),
  T(18, 'UML & Patterns', 'Structural · Adapter & Facade', 'Interfaces and simplification.', [
    ['Adapter', 'adapter', 'pattern'], ['Facade', 'facade', 'pattern'],
  ]),
  T(19, 'UML & Patterns', 'Structural · Decorator & Composite', 'Wrapping and trees.', [
    ['Decorator', 'decorator', 'pattern'], ['Composite', 'composite', 'pattern'],
  ]),
  T(20, 'UML & Patterns', 'Structural · Proxy & Bridge', 'Access control and decoupling.', [
    ['Proxy', 'proxy', 'pattern'], ['Bridge', 'bridge', 'pattern'],
  ]),
  T(21, 'UML & Patterns', 'Structural/Behavioral · Flyweight & Strategy', 'Sharing state; swappable algorithms.', [
    ['Flyweight', 'flyweight', 'pattern'], ['Strategy', 'strategy', 'pattern'],
  ]),
  T(22, 'UML & Patterns', 'Behavioral · Iterator & Observer', 'Traversal and notifications.', [
    ['Iterator', 'iterator', 'pattern'], ['Observer', 'observer', 'pattern'],
  ]),
  T(23, 'UML & Patterns', 'Behavioral · Command & State', 'Requests as objects; state machines.', [
    ['Command', 'command', 'pattern'], ['State', 'state', 'pattern'],
  ]),
  T(24, 'UML & Patterns', 'Behavioral · Template Method & CoR', 'Skeletons and handler chains.', [
    ['Template Method', 'template-method', 'pattern'], ['Chain of Responsibility', 'chain-of-responsibility', 'pattern'],
  ]),
  T(25, 'UML & Patterns', 'Behavioral · Visitor, Mediator, Memento', 'Operations, coordination, undo.', [
    ['Visitor', 'visitor', 'pattern'], ['Mediator', 'mediator', 'pattern'], ['Memento', 'memento', 'pattern'],
  ]),
  T(26, 'UML & Patterns', 'Additional · Null Object, Repository, MVC', 'Everyday architectural patterns.', [
    ['Null Object', 'null-object', 'pattern'], ['Repository', 'repository', 'pattern'], ['MVC', 'mvc', 'pattern'],
  ]),
  T(27, 'UML & Patterns', 'Additional · DI & Specification', 'Injection and composable rules.', [
    ['Dependency Injection', 'dependency-injection', 'pattern'], ['Specification', 'specification', 'pattern'],
  ]),
  T(28, 'UML & Patterns', 'Additional · Game Loop & Concurrency', 'Loops, pools, producer–consumer.', [
    ['Game Loop', 'game-loop', 'pattern'], ['Thread Pool', 'thread-pool', 'pattern'], ['Producer Consumer', 'producer-consumer', 'pattern'],
  ]),
  T(29, 'Interview Tips', 'Approaching Interviews', 'The OOD & machine-coding playbooks.', [
    ['How to approach OOD Interviews', 'ood-approach'], ['How to approach Machine Coding Interviews', 'machine-coding-approach'],
  ]),
  T(30, 'Interview Tips', 'Modeling & Clean Code', 'Find entities; write clean code.', [
    ['How to Identify Entities & Model Relationships', 'identifying-entities'], ['How to write Clean Code', 'writing-clean-code'],
  ]),
  T(31, 'Interview Tips', 'Patterns & Concurrency', 'Choosing patterns; handling concurrency.', [
    ['How to choose Design Patterns', 'choosing-design-patterns'], ['How to handle Concurrency Scenarios', 'handling-concurrency'],
  ]),

  // ── QUESTIONS · all 33, 2/day (three light days carry a 3rd) (Nov 1–15) ──
  Q(32, 'State-machine warm-ups', 'Cleanest State-pattern demonstrations.', 'ALL', [
    ['Vending Machine', 'vending-machine', 1], ['Coffee Vending Machine', 'coffee-vending-machine', 1], ['Traffic Signal Control System', 'traffic-signal', 1],
  ]),
  Q(33, 'State + data structures', 'Transaction state; HashMap + DLL.', null, [
    ['ATM', 'atm'], ['LRU Cache', 'lru-cache'],
  ]),
  Q(34, 'Patterns in practice', 'CoR, Observer & Strategy in the wild.', 'ALL', [
    ['Logging Framework', 'logging-framework', 1], ['Pub Sub System', 'pub-sub-system'], ['Task Management System', 'task-management-system', 1],
  ]),
  Q(35, 'Simple games', 'Board modeling + rules.', null, [
    ['Tic Tac Toe', 'tic-tac-toe'], ['Snake and Ladder', 'snake-and-ladder'],
  ]),
  Q(36, 'Complex state & scheduling', 'Rules engines and dispatch.', null, [
    ['Chess Game', 'chess-game', 2], ['Elevator System', 'elevator-system'],
  ]),
  Q(37, 'Allocation & reservation', 'The canonical warm-up + reuse.', null, [
    ['Parking Lot', 'parking-lot'], ['Car Rental System', 'car-rental-system'],
  ]),
  Q(38, 'Booking & modeling', 'Reservation, inventory, rich entities.', 'ALL', [
    ['Hotel Management System', 'hotel-management-system'], ['Library Management System', 'library-management-system'], ['Stack Overflow', 'stack-overflow', 1],
  ]),
  Q(39, 'Seat reservation', 'Inventory + seat maps.', null, [
    ['Airline Management System', 'airline-management-system'], ['Concert Ticket Booking System', 'concert-ticket-booking-system'],
  ]),
  Q(40, 'Reservation + concurrency', 'The double-booking stress test.', null, [
    ['Movie Ticket Booking System', 'movie-ticket-booking-system', 2], ['Restaurant Management System', 'restaurant-management-system'],
  ]),
  Q(41, 'Contention & bidding', 'Constraints and concurrent bids.', null, [
    ['Course Registration System', 'course-registration-system', 2], ['Online Auction System', 'online-auction-system'],
  ]),
  Q(42, 'Social & reputation', 'Users, connections, reputation.', null, [
    ['LinkedIn', 'linkedin', 2], ['Social Network (Facebook)', 'social-networking-service', 2],
  ]),
  Q(43, 'Feeds at scale', 'Live updates and observers.', null, [
    ['CricInfo', 'cricinfo', 2], ['Splitwise', 'splitwise', 2],
  ]),
  Q(44, 'Money & ledgers', 'Core fintech interview problems.', 'FINANCE', [
    ['Digital Wallet Service', 'digital-wallet-service', 2], ['Online Stock Brokerage System', 'online-stock-brokerage-system', 2],
  ]),
  Q(45, 'Marketplace & matching', 'Cart/catalog + rider matching.', 'FAANG', [
    ['Online Shopping System (Amazon)', 'online-shopping-service', 2], ['Ride-Sharing Service (Uber)', 'ride-sharing-service', 2],
  ]),
  Q(46, 'Real-time capstone', 'Dispatch and streaming at scale.', 'FAANG', [
    ['Online Food Delivery (Swiggy)', 'food-delivery-service', 2], ['Music Streaming (Spotify)', 'music-streaming-service', 2],
  ]),
]

export const LLD_PHASES = ['OOP Foundations', 'Design Principles', 'UML & Patterns', 'Interview Tips', 'Questions']
export const LLD_START = '2026-10-01'
export const LLD_END = '2026-11-15'
export const LLD_TOTAL_DAYS = LLD_DAYS.length
export const LLD_ALL_ITEMS = LLD_DAYS.flatMap((d) => d.items)
export const LLD_TOTAL_ITEMS = LLD_ALL_ITEMS.length

export const dayComplete = (day, doneMap) => day.items.length > 0 && day.items.every((it) => doneMap[it.key])
export function currentDayIndex(doneMap) {
  const i = LLD_DAYS.findIndex((d) => !dayComplete(d, doneMap))
  return i === -1 ? LLD_DAYS.length : i + 1
}
export function lldPct(doneMap) {
  const done = LLD_ALL_ITEMS.filter((it) => doneMap[it.key]).length
  return { doneItems: done, totalItems: LLD_TOTAL_ITEMS, pct: LLD_TOTAL_ITEMS ? Math.round((done / LLD_TOTAL_ITEMS) * 100) : 0 }
}
export function phaseStats(doneMap) {
  return LLD_PHASES.map((ph) => {
    const its = LLD_DAYS.filter((d) => d.phase === ph).flatMap((d) => d.items)
    const d = its.filter((it) => doneMap[it.key]).length
    return { phase: ph, done: d, total: its.length, pct: its.length ? Math.round((d / its.length) * 100) : 0 }
  })
}
export function doneDaysCount(doneMap) {
  return LLD_DAYS.filter((d) => dayComplete(d, doneMap)).length
}
export function writeLldStats(doneMap) {
  const { doneItems, totalItems, pct } = lldPct(doneMap)
  setStore('lld:stats', { done: doneItems, total: totalItems, pct, doneDays: doneDaysCount(doneMap) })
}

export const TYPE_LABEL = { concept: 'Concept', pattern: 'Pattern', problem: 'Problem', practice: 'Practice', mock: 'Mock' }
