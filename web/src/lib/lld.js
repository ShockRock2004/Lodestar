// Low Level Design — 35-day plan (Oct 1 → Nov 4, 2026).
// THEORY (Oct 1–24): every lesson from the AlgoMaster LLD course in its EXACT course order,
//   from Course Introduction through the "LLD Interview Tips" module (algomaster.io/learn/lld),
//   packed to ~3 lessons/day so the course fits in 24 days instead of 31.
// QUESTIONS (Oct 25–Nov 4): all 33 problems from github.com/ashishps1/awesome-low-level-design,
//   3/day flat (33 / 3 = 11 days) — clustered by theme, warm-ups first, hardest last.
import { setStore } from './store.js'

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
  // ── THEORY · exact AlgoMaster course order, packed to 24 days (Oct 1–24) ──
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
  T(6, 'OOP Foundations', 'Class Relationships I & II', 'Model "has-a" vs "owns-a"; dependencies and realization.', [
    ['Association', 'association'], ['Aggregation', 'aggregation'], ['Composition', 'composition'],
    ['Dependency', 'dependency'], ['Realization', 'realization'],
  ]),
  T(7, 'Design Principles', 'Principles · DRY, KISS, YAGNI', 'Keep designs lean.', [
    ['DRY Principle', 'dry'], ['KISS Principle', 'kiss'], ['YAGNI Principle', 'yagni'],
  ]),
  T(8, 'Design Principles', 'Principles · Demeter, SoC, Coupling & Composing', 'Loose coupling by construction.', [
    ['Law of Demeter', 'lod'], ['Separation of Concerns', 'soc'],
    ['Coupling and Cohesion', 'coupling-and-cohesion'], ['Composing Objects Principle', 'composing-objects'],
  ]),
  T(9, 'Design Principles', 'SOLID I — SRP & OCP', 'The two that drive most decisions.', [
    ['Single Responsibility Principle', 'srp'], ['Open/Closed Principle', 'ocp'],
  ]),
  T(10, 'Design Principles', 'SOLID II — LSP, ISP, DIP', 'Substitutability, lean interfaces, inversion.', [
    ['Liskov Substitution Principle', 'lsp'], ['Interface Segregation Principle', 'isp'], ['Dependency Inversion Principle', 'dip'],
  ]),
  T(11, 'UML & Patterns', 'UML I · Class & Use Case', 'Draw the design.', [
    ['Class Diagram', 'class-diagram'], ['Use Case Diagram', 'use-case-diagram'],
  ]),
  T(12, 'UML & Patterns', 'UML II · Sequence, Activity, State', 'Behavior over time.', [
    ['Sequence Diagram', 'sequence-diagram'], ['Activity Diagram', 'activity-diagram'], ['State Machine Diagram', 'state-machine-diagram'],
  ]),
  T(13, 'UML & Patterns', 'Patterns · Intro + Singleton', 'Design patterns begin.', [
    ['Intro to Design Patterns', 'design-patterns'], ['Singleton', 'singleton', 'pattern'],
  ]),
  T(14, 'UML & Patterns', 'Creational · Builder, Factory, Abstract Factory, Prototype', 'Constructing objects and families of them.', [
    ['Builder', 'builder', 'pattern'], ['Factory Method', 'factory-method', 'pattern'],
    ['Abstract Factory', 'abstract-factory', 'pattern'], ['Prototype', 'prototype', 'pattern'],
  ]),
  T(15, 'UML & Patterns', 'Structural I · Adapter, Facade, Decorator, Composite', 'Interfaces, simplification, wrapping, trees.', [
    ['Adapter', 'adapter', 'pattern'], ['Facade', 'facade', 'pattern'],
    ['Decorator', 'decorator', 'pattern'], ['Composite', 'composite', 'pattern'],
  ]),
  T(16, 'UML & Patterns', 'Structural II · Proxy, Bridge, Flyweight, Strategy', 'Access control, decoupling, shared state, swappable algorithms.', [
    ['Proxy', 'proxy', 'pattern'], ['Bridge', 'bridge', 'pattern'],
    ['Flyweight', 'flyweight', 'pattern'], ['Strategy', 'strategy', 'pattern'],
  ]),
  T(17, 'UML & Patterns', 'Behavioral I · Iterator, Observer, Command, State', 'Traversal, notifications, requests as objects, state machines.', [
    ['Iterator', 'iterator', 'pattern'], ['Observer', 'observer', 'pattern'],
    ['Command', 'command', 'pattern'], ['State', 'state', 'pattern'],
  ]),
  T(18, 'UML & Patterns', 'Behavioral II · Template Method & CoR', 'Skeletons and handler chains.', [
    ['Template Method', 'template-method', 'pattern'], ['Chain of Responsibility', 'chain-of-responsibility', 'pattern'],
  ]),
  T(19, 'UML & Patterns', 'Behavioral III · Visitor, Mediator, Memento', 'Operations, coordination, undo.', [
    ['Visitor', 'visitor', 'pattern'], ['Mediator', 'mediator', 'pattern'], ['Memento', 'memento', 'pattern'],
  ]),
  T(20, 'UML & Patterns', 'Additional · Null Object, Repository, MVC, DI, Specification', 'Everyday architectural patterns and composable rules.', [
    ['Null Object', 'null-object', 'pattern'], ['Repository', 'repository', 'pattern'], ['MVC', 'mvc', 'pattern'],
    ['Dependency Injection', 'dependency-injection', 'pattern'], ['Specification', 'specification', 'pattern'],
  ]),
  T(21, 'UML & Patterns', 'Additional · Game Loop & Concurrency', 'Loops, pools, producer–consumer.', [
    ['Game Loop', 'game-loop', 'pattern'], ['Thread Pool', 'thread-pool', 'pattern'], ['Producer Consumer', 'producer-consumer', 'pattern'],
  ]),
  T(22, 'Interview Tips', 'Approaching Interviews', 'The OOD & machine-coding playbooks.', [
    ['How to approach OOD Interviews', 'ood-approach'], ['How to approach Machine Coding Interviews', 'machine-coding-approach'],
  ]),
  T(23, 'Interview Tips', 'Modeling & Clean Code', 'Find entities; write clean code.', [
    ['How to Identify Entities & Model Relationships', 'identifying-entities'], ['How to write Clean Code', 'writing-clean-code'],
  ]),
  T(24, 'Interview Tips', 'Patterns & Concurrency', 'Choosing patterns; handling concurrency.', [
    ['How to choose Design Patterns', 'choosing-design-patterns'], ['How to handle Concurrency Scenarios', 'handling-concurrency'],
  ]),

  // ── QUESTIONS · all 33, 3/day flat (33 / 3 = 11 days) (Oct 25–Nov 4) ──
  Q(25, 'State-machine warm-ups', 'Cleanest State-pattern demonstrations.', null, [
    ['Vending Machine', 'vending-machine', 1], ['Coffee Vending Machine', 'coffee-vending-machine', 1], ['Traffic Signal Control System', 'traffic-signal', 1],
  ]),
  Q(26, 'State, data structures & patterns', 'Transaction state, HashMap + DLL, CoR in the wild.', null, [
    ['ATM', 'atm'], ['LRU Cache', 'lru-cache'], ['Logging Framework', 'logging-framework', 1],
  ]),
  Q(27, 'Patterns + simple games', 'Observer & Strategy in the wild; board modeling begins.', null, [
    ['Pub Sub System', 'pub-sub-system'], ['Task Management System', 'task-management-system', 1], ['Tic Tac Toe', 'tic-tac-toe'],
  ]),
  Q(28, 'Games & complex state', 'Board rules, then a rules engine and dispatch.', null, [
    ['Snake and Ladder', 'snake-and-ladder'], ['Chess Game', 'chess-game', 2], ['Elevator System', 'elevator-system'],
  ]),
  Q(29, 'Allocation & booking', 'The canonical warm-up, reuse, and rich reservation entities.', null, [
    ['Parking Lot', 'parking-lot'], ['Car Rental System', 'car-rental-system'], ['Hotel Management System', 'hotel-management-system'],
  ]),
  Q(30, 'Booking, catalog & seat maps', 'Inventory-heavy systems and seat reservation.', null, [
    ['Library Management System', 'library-management-system'], ['Stack Overflow', 'stack-overflow', 1], ['Airline Management System', 'airline-management-system'],
  ]),
  Q(31, 'Seat reservation + concurrency', 'Seat maps and the double-booking stress test.', null, [
    ['Concert Ticket Booking System', 'concert-ticket-booking-system'], ['Movie Ticket Booking System', 'movie-ticket-booking-system', 2], ['Restaurant Management System', 'restaurant-management-system'],
  ]),
  Q(32, 'Contention, bidding & social', 'Constraints, concurrent bids, and a social graph.', null, [
    ['Course Registration System', 'course-registration-system', 2], ['Online Auction System', 'online-auction-system'], ['LinkedIn', 'linkedin', 2],
  ]),
  Q(33, 'Social & feeds at scale', 'Connections, reputation, live updates and observers.', null, [
    ['Social Network (Facebook)', 'social-networking-service', 2], ['CricInfo', 'cricinfo', 2], ['Splitwise', 'splitwise', 2],
  ]),
  Q(34, 'Money & marketplace', 'Core fintech interview problems, then cart/catalog.', 'FINANCE', [
    ['Digital Wallet Service', 'digital-wallet-service', 2], ['Online Stock Brokerage System', 'online-stock-brokerage-system', 2], ['Online Shopping System (Amazon)', 'online-shopping-service', 2],
  ]),
  Q(35, 'Real-time capstone', 'Rider matching, dispatch and streaming at scale.', 'FAANG', [
    ['Ride-Sharing Service (Uber)', 'ride-sharing-service', 2], ['Online Food Delivery (Swiggy)', 'food-delivery-service', 2], ['Music Streaming (Spotify)', 'music-streaming-service', 2],
  ]),
]

export const LLD_PHASES = ['OOP Foundations', 'Design Principles', 'UML & Patterns', 'Interview Tips', 'Questions']
export const LLD_START = '2026-10-01'
export const LLD_END = '2026-11-04'
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
