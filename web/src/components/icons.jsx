import { useId } from 'react'
// Shared line icons (inherit color via currentColor). Match the artifact exactly.
const S = (p, extra = {}) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"
    strokeLinecap="round" strokeLinejoin="round" {...extra}>{p}</svg>
)

export const IconHome = () => S(<><path d="M4 11l8-7 8 7" /><path d="M6 10v9h12v-9" /></>)
export const IconGrid = () => S(<><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></>)
export const IconCalendar = () => S(<><rect x="4" y="5" width="16" height="16" rx="2.5" /><path d="M4 9h16M8 3v4M16 3v4" /></>)
export const IconPlus = () => S(<path d="M12 5v14M5 12h14" />, { strokeWidth: 2.2 })
export const IconUser = () => S(<><circle cx="12" cy="8" r="3.5" /><path d="M5 20c1.2-3.8 4-5 7-5s5.8 1.2 7 5" /></>)
export const IconBell = () => S(<><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" /><path d="M10 20a2 2 0 0 0 4 0" /></>, { strokeWidth: 1.8 })
export const IconSearch = () => S(<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></>)
export const IconChevron = () => S(<path d="M9 6l6 6-6 6" />, { strokeWidth: 2.2 })
export const IconBack = () => S(<path d="M15 6l-6 6 6 6" />, { strokeWidth: 2.2 })
export const IconArrowUp = () => S(<path d="M5 12l7-7 7 7M12 5v14" />, { strokeWidth: 2.4 })
export const IconSun = () => S(<><circle cx="12" cy="12" r="4.5" /><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" /></>)
export const IconMoon = () => S(<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />)
export const IconFlame = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c1.2 3.6 4.8 4.8 4.8 9.2A4.8 4.8 0 0 1 7.2 11C7.2 9 8 7.8 8.8 7 9 9.5 12 8.5 12 2Z" /></svg>
)
export const IconFlag = () => S(<path d="M5 21V4h9l-1.5 3L14 10H5" />)

// section glyphs
export const IconChart = () => S(<><path d="M4 20V13M10 20V6M16 20v-9" /><path d="M3 20h18" /></>)

export const IconDsa = () => S(<><path d="M7 8l-4 4 4 4" /><path d="M17 8l4 4-4 4" /><path d="M14 4l-4 16" /></>, { strokeWidth: 1.8 })
export const IconSys = () => S(<><rect width="20" height="8" x="2" y="2" rx="2" ry="2" /><rect width="20" height="8" x="2" y="14" rx="2" ry="2" /><line x1="6" x2="6.01" y1="6" y2="6" /><line x1="6" x2="6.01" y1="18" y2="18" /></>, { strokeWidth: 1.8 })
export const IconCs = () => S(<><rect x="7" y="7" width="10" height="10" rx="1.5" /><path d="M10 3v3M14 3v3M10 18v3M14 18v3M3 10h3M3 14h3M18 10h3M18 14h3" /></>, { strokeWidth: 1.8 })
export const IconOdin = () => S(<><path d="M12 3.2 3.3 8l8.7 4.8L20.7 8 12 3.2Z" /><path d="M3.3 12l8.7 4.8L20.7 12" /><path d="M3.3 16l8.7 4.8L20.7 16" /></>, { strokeWidth: 1.7 })
export const IconLld = () => S(<><rect x="9" y="3" width="6" height="4.4" rx="1" /><rect x="3" y="14.6" width="6" height="4.4" rx="1" /><rect x="15" y="14.6" width="6" height="4.4" rx="1" /><path d="M12 7.4v3.4M6 14.6v-3.8h12v3.8" /></>, { strokeWidth: 1.8 })
export const IconMl = () => S(<><path d="M12 18V5" /><path d="M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4" /><path d="M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5" /><path d="M17.997 5.125a4 4 0 0 1 2.526 5.77" /><path d="M18 18a4 4 0 0 0 2-7.464" /><path d="M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517" /><path d="M6 18a4 4 0 0 1-2-7.464" /><path d="M6.003 5.125a4 4 0 0 0-2.526 5.77" /></>, { strokeWidth: 1.7 })

export function FlameFire({ size = 20 }) {
  const gid = 'ff' + useId().replace(/[^a-zA-Z0-9]/g, '')
  return (
    <span className="flamefire" style={{ display: 'inline-flex', width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 24 24" width={size} height={size}>
        <defs>
          <linearGradient id={gid} x1="0.5" y1="1" x2="0.5" y2="0">
            <stop offset="0" stopColor="#ff2d16" />
            <stop offset="0.5" stopColor="#ff6a1e" />
            <stop offset="1" stopColor="#ff9d1f" />
          </linearGradient>
        </defs>
        <path className="ff-outer" fill={`url(#${gid})`} d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
        <path fill="#ffd23f" transform="translate(12 15.2) scale(0.5) translate(-12 -12)" d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
      </svg>
    </span>
  )
}


// ---- Lodestar mark: a concave 4-point star in the signature metallic gradient ----
export function LodestarMark({ size = 26 }) {
  const gid = 'ls' + useId().replace(/[^a-zA-Z0-9]/g, '')
  return (
    <span className="lodestar-mark" style={{ display: 'inline-flex', width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 24 24" width={size} height={size}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#3b3b3b" />
            <stop offset="0.28" stopColor="#8a8a8a" />
            <stop offset="0.5" stopColor="#ffffff" />
            <stop offset="0.72" stopColor="#8a8a8a" />
            <stop offset="1" stopColor="#3b3b3b" />
          </linearGradient>
        </defs>
        <path fill={`url(#${gid})`} d="M12 0C12.3 7.7 16.3 11.7 24 12C16.3 12.3 12.3 16.3 12 24C11.7 16.3 7.7 12.3 0 12C7.7 11.7 11.7 7.7 12 0Z" />
      </svg>
    </span>
  )
}

// ---- Tech-stack logos rendered in the app gradient (monochrome silver) ----
export const TECH_LABEL = { html: 'HTML', css: 'CSS', javascript: 'JavaScript', git: 'Git', react: 'React', node: 'Node.js', express: 'Express', sql: 'SQL', code: 'Full Stack' }

export function TechLogo({ tech = 'code', size = 128 }) {
  const gid = 'tg' + useId().replace(/[^a-zA-Z0-9]/g, '')
  const g = `url(#${gid})`
  const marks = {
    html: <path fill={g} d="M1.5 0h21l-1.91 21.563L11.977 24l-8.564-2.438L1.5 0zm7.031 9.75l-.232-2.718 10.059.003.23-2.622L5.412 4.41l.698 8.01h9.126l-.326 3.426-2.91.804-2.955-.81-.188-2.11H6.248l.33 4.171L12 19.351l5.379-1.443.744-8.157H8.531z" />,
    css: <path fill={g} d="M1.5 0h21l-1.91 21.563L11.977 24l-8.565-2.438L1.5 0zm17.09 4.413L5.41 4.41l.213 2.622 10.125.002-.255 2.716h-6.64l.24 2.573h6.182l-.366 3.523-2.91.804-2.956-.81-.188-2.11h-2.61l.29 3.855L12 19.288l5.373-1.53L18.59 4.414z" />,
    javascript: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2.5" fill={g} />
        <text x="12.2" y="16.4" textAnchor="middle" fontSize="8.4" fontWeight="800" fill="#0c0c0e" fontFamily="system-ui, sans-serif">JS</text>
      </>
    ),
    react: (
      <>
        <g fill="none" stroke={g} strokeWidth="1.25">
          <ellipse cx="12" cy="12" rx="10" ry="4.15" />
          <ellipse cx="12" cy="12" rx="10" ry="4.15" transform="rotate(60 12 12)" />
          <ellipse cx="12" cy="12" rx="10" ry="4.15" transform="rotate(120 12 12)" />
        </g>
        <circle cx="12" cy="12" r="2.05" fill={g} />
      </>
    ),
    node: <path fill={g} d="M11.998,24c-0.321,0-0.641-0.084-0.922-0.247l-2.936-1.737c-0.438-0.245-0.224-0.332-0.08-0.383 c0.585-0.203,0.703-0.25,1.328-0.604c0.065-0.037,0.151-0.023,0.218,0.017l2.256,1.339c0.082,0.045,0.197,0.045,0.272,0l8.795-5.076 c0.082-0.047,0.134-0.141,0.134-0.238V6.921c0-0.099-0.053-0.192-0.137-0.242l-8.791-5.072c-0.081-0.047-0.189-0.047-0.271,0 L3.075,6.68C2.99,6.729,2.936,6.825,2.936,6.921v10.15c0,0.097,0.054,0.189,0.139,0.235l2.409,1.392 c1.307,0.654,2.108-0.116,2.108-0.89V7.787c0-0.142,0.114-0.253,0.256-0.253h1.115c0.139,0,0.255,0.112,0.255,0.253v10.021 c0,1.745-0.95,2.745-2.604,2.745c-0.508,0-0.909,0-2.026-0.551L2.28,18.675c-0.57-0.329-0.922-0.945-0.922-1.604V6.921 c0-0.659,0.353-1.275,0.922-1.603l8.795-5.082c0.557-0.315,1.296-0.315,1.848,0l8.794,5.082c0.57,0.329,0.924,0.944,0.924,1.603 v10.15c0,0.659-0.354,1.273-0.924,1.604l-8.794,5.078C12.643,23.916,12.324,24,11.998,24z M19.099,13.993 c0-1.9-1.284-2.406-3.987-2.763c-2.731-0.361-3.009-0.548-3.009-1.187c0-0.528,0.235-1.233,2.258-1.233 c1.807,0,2.473,0.389,2.747,1.607c0.024,0.115,0.129,0.199,0.247,0.199h1.141c0.071,0,0.138-0.031,0.186-0.081 c0.048-0.054,0.074-0.123,0.067-0.196c-0.177-2.098-1.571-3.076-4.388-3.076c-2.508,0-4.004,1.058-4.004,2.833 c0,1.925,1.488,2.457,3.895,2.695c2.88,0.282,3.103,0.703,3.103,1.269c0,0.983-0.789,1.402-2.642,1.402 c-2.327,0-2.839-0.584-3.011-1.742c-0.02-0.124-0.126-0.215-0.253-0.215h-1.137c-0.141,0-0.254,0.112-0.254,0.253 c0,1.482,0.806,3.248,4.655,3.248C17.501,17.007,19.099,15.91,19.099,13.993z" />,
    express: <path fill={g} d="M24 18.588a1.529 1.529 0 01-1.895-.72l-3.45-4.771-.5-.667-4.003 5.444a1.466 1.466 0 01-1.802.708l5.158-6.92-4.798-6.251a1.595 1.595 0 011.9.666l3.576 4.83 3.596-4.81a1.435 1.435 0 011.788-.668L21.708 7.9l-2.522 3.283a.666.666 0 000 .994l4.804 6.412zM.002 11.576l.42-2.075c1.154-4.103 5.858-5.81 9.094-3.27 1.895 1.489 2.368 3.597 2.275 5.973H1.116C.943 16.447 4.005 19.009 7.92 17.7a4.078 4.078 0 002.582-2.876c.207-.666.548-.78 1.174-.588a5.417 5.417 0 01-2.589 3.957 6.272 6.272 0 01-7.306-.933 6.575 6.575 0 01-1.64-3.858c0-.235-.08-.455-.134-.666A88.33 88.33 0 010 11.577zm1.127-.286h9.654c-.06-3.076-2.001-5.258-4.59-5.278-2.882-.04-4.944 2.094-5.071 5.264z" />,
    git: (
      <>
        <path fill="none" stroke={g} strokeWidth="1.5" strokeLinecap="round" d="M12 20V9M12 12l4.3-4.3" />
        <g fill={g}>
          <circle cx="12" cy="8.3" r="2" />
          <circle cx="12" cy="20" r="2" />
          <circle cx="17" cy="5.6" r="2" />
        </g>
      </>
    ),
    sql: (
      <g fill={g}>
        <ellipse cx="12" cy="5.6" rx="7" ry="2.6" />
        <path d="M5 5.6v12.8c0 1.44 3.13 2.6 7 2.6s7-1.16 7-2.6V5.6c0 1.44-3.13 2.6-7 2.6s-7-1.16-7-2.6Z" fillOpacity="0.82" />
        <ellipse cx="12" cy="12" rx="7" ry="2.4" fill="#0c0c0e" fillOpacity="0.28" />
      </g>
    ),
    code: (
      <g fill="none" stroke={g} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3.2 3.3 8l8.7 4.8L20.7 8 12 3.2Z" />
        <path d="M3.3 12l8.7 4.8L20.7 12" />
        <path d="M3.3 16l8.7 4.8L20.7 16" />
      </g>
    ),
  }
  return (
    <span className="techlogo" style={{ display: 'inline-flex', width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 24 24" width={size} height={size}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#5b5b5b" /><stop offset="0.5" stopColor="#ededed" /><stop offset="1" stopColor="#5b5b5b" />
          </linearGradient>
        </defs>
        {marks[tech] || marks.code}
      </svg>
    </span>
  )
}

// ---- Competitive-programming platform brand marks (approximate, recognizable) ----
export function LeetCodeMark({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#FFA116" aria-hidden="true">
      <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z" />
    </svg>
  )
}
export function CodeforcesMark({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="0" y="7.5" width="6" height="13.5" rx="1.5" fill="#1F8ACB" />
      <rect x="9" y="3" width="6" height="18" rx="1.5" fill="#E43F3F" />
      <rect x="18" y="10.5" width="6" height="10.5" rx="1.5" fill="#F5C518" />
    </svg>
  )
}
export function CodeChefMark({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#C7935B" aria-hidden="true">
      <path d="M11.2574.0039c-.37.0101-.7353.041-1.1003.095C9.6164.153 9.0766.4236 8.482.694c-.757.3244-1.5147.6486-2.2176.7027-1.1896.3785-1.568.919-1.8925 1.3516 0 .054-.054.1079-.054.1079-.4325.865-.4873 1.73-.325 2.5952.1621.5407.3786 1.0282.5408 1.5148.3785 1.0274.7578 2.0007.92 3.1362.1622.3244.3235.7571.4316 1.1897.2704.8651.542 1.8383 1.353 2.5952l.0057-.0028c.0175.0183.0301.0387.0482.0568.0072-.0036.0141-.0063.0213-.0099l-.0213-.5849c.6489-.9733 1.5673-1.6221 2.865-1.8925.5195-.1093 1.081-.1497 1.6625-.1278a8.7733 8.7733 0 0 1 1.7988.2357c1.4599.3785 2.595 1.1358 2.6492 1.7846.0273.3549.0398.6952.0326 1.0364-.001.064-.0046.1285-.007.193l.1362.0682c.075-.0375.1424-.107.2059-.1902.0008-.001.002-.002.0028-.0028.0018-.0023.0039-.0061.0057-.0085.0396-.0536.0747-.1236.1107-.1931.0188-.0377.0372-.0866.0554-.1292.2048-.4622.362-1.1536.538-1.9635.0541-.2703.1092-.4864.1633-.7027.4326-.9733 1.0266-1.8382 1.6213-2.6492.9733-1.3518 1.8928-2.5962 1.7846-4.0561-1.784-3.4608-4.2718-4.0017-5.5695-4.272-.2163-.0541-.3233-.0539-.4856-.108-1.3382-.2433-2.4945-.3953-3.6046-.3648zm5.0428 14.3788a9.8602 9.8602 0 0 0-.0326-.9824c-.0541-.703-1.1892-1.46-2.7032-1.8386-.588-.1336-1.1764-.2142-1.7448-.2356-.539-.0137-1.0657.0248-1.5546.1277-1.2436.2704-2.2162.9193-2.811 1.8925l.0511 1.431c.6672-.3558 1.7326-.8747 3.139-.9994.0662-.0059.1368-.0059.2044-.0099.1177-.013.2667-.044.4444-.044 1.6075 0 3.2682.5336 4.8767 1.6483.039-.2744.0611-.549.071-.8234l.044.0227c.0028-.0622.0143-.1268.0156-.1888z" />
    </svg>
  )
}
export function PlatformLogo({ platform, size = 18 }) {
  if (platform === 'LeetCode') return <LeetCodeMark size={size} />
  if (platform === 'Codeforces') return <CodeforcesMark size={size} />
  if (platform === 'CodeChef') return <CodeChefMark size={size} />
  return null
}
export const CONTEST_PLATFORMS = ['LeetCode', 'Codeforces', 'CodeChef']
