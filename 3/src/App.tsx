import { useState, useRef, MouseEvent, ReactNode, useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

const LogoSVG = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 447 125" 
    className="w-full h-auto text-current block"
    fill="currentColor"
  >
    <path d="M32.9705 31.7698V77.3622C32.9705 82.4643 32.8695 87.5101 32.6673 92.511C32.6673 97.5119 32.7122 102.558 32.8133 107.66C32.9144 112.661 32.5663 117.662 31.7689 122.651H0.303203C0.202135 122.157 0.101068 121.606 0 120.999V70.1587C0 69.4619 0.101068 68.7539 0.303203 68.0572C0.606406 67.3604 0.797312 66.6524 0.89838 65.9557C1.20158 64.7532 1.34757 63.562 1.34757 62.3595C1.44864 56.5607 1.49356 50.8181 1.49356 45.1092C1.49356 39.4003 1.59462 33.6577 1.79676 27.8589C1.79676 23.4649 1.89783 19.0596 2.09996 14.6656C2.40317 10.2715 2.59407 5.86622 2.69514 1.47217H32.6673C32.8695 6.57421 32.9144 11.665 32.8133 16.7671C32.8133 21.768 32.8582 26.7689 32.9593 31.7585L32.9705 31.7698Z"/>
    <path d="M101.641 123.842C99.1475 123.64 96.5984 123.696 93.9931 123.989C91.5 124.393 89.052 124.438 86.6488 124.135C85.2451 124.135 84.3018 123.483 83.7965 122.191C81.4944 116.594 79.1024 111.042 76.5982 105.547C74.2062 100.052 71.702 94.5451 69.1079 89.0497C68.9058 94.8485 68.6587 100.647 68.3555 106.446C68.1534 112.144 67.9513 117.943 67.7604 123.842C67.0641 123.842 66.4128 123.887 65.8176 123.989C65.3235 124.09 64.8182 124.135 64.3241 124.135H43.0437C41.2469 124.135 40.1464 123.932 39.7422 123.539C39.439 123.134 39.293 121.988 39.293 120.089V5.22566H67.7604C70.4555 11.6201 73.1507 18.1269 75.857 24.7236C78.5522 31.2191 81.3034 37.7708 84.0996 44.3675H84.6948V9.42867C84.6948 7.32717 84.897 6.1247 85.29 5.83252C85.6943 5.42795 86.9408 5.2369 89.0407 5.2369C96.632 5.2369 104.178 5.09081 111.669 4.78738H116.015V123.101H114.51C114.016 123.202 113.465 123.247 112.859 123.247C111.062 123.348 109.164 123.494 107.166 123.696C105.268 124 103.415 124.045 101.618 123.842H101.641Z"/>
    <path d="M126.402 124.438C125.908 124.438 125.302 124.292 124.605 123.989C124.01 123.786 123.258 123.494 122.359 123.09C124.156 120.595 125.111 118.246 125.2 116.043C125.403 113.74 124.605 111.447 122.797 109.143C123.202 108.649 123.595 108.143 123.999 107.649C124.493 107.053 124.953 106.502 125.346 105.997C124.145 105.401 123.393 104.648 123.101 103.749C122.898 102.85 122.797 101.749 122.797 100.445V4.77614C122.898 4.18053 122.943 3.52873 122.943 2.83197C125.245 2.83197 127.536 2.78702 129.838 2.68588C132.14 2.4836 134.386 2.73083 136.587 3.43882C137.98 4.03444 139.44 4.439 140.933 4.64129C142.528 4.74243 144.078 4.94471 145.582 5.2369C150.782 6.33822 155.42 8.23744 159.519 10.9346C163.617 13.6317 167.559 16.6884 171.355 20.0823C175.15 23.4761 178.048 27.3308 180.047 31.6237C182.045 35.9278 183.842 40.423 185.437 45.1205C186.133 47.3231 186.537 49.6157 186.638 52.0206C186.74 54.3244 186.784 56.6169 186.784 58.9207C186.784 60.2243 186.74 61.5729 186.638 62.9664C186.638 64.27 186.683 65.6185 186.784 67.0121C187.279 72.912 186.582 78.5535 184.684 83.9589C182.787 89.3531 180.294 94.5563 177.194 99.5572C176.7 100.456 175.993 101.31 175.094 102.108C174.297 102.805 173.5 103.558 172.691 104.356C171.096 105.659 169.547 107.053 168.042 108.559C166.548 110.053 164.943 111.503 163.247 112.908C162.146 113.807 160.9 114.661 159.496 115.459C158.193 116.156 156.846 116.909 155.453 117.707C153.96 118.403 152.41 118.954 150.804 119.359C149.21 119.763 147.952 120.853 147.054 122.663C146.851 123.258 146.155 123.708 144.954 124.011C143.853 124.314 142.854 124.461 141.955 124.461C136.756 124.764 131.568 124.764 126.368 124.461L126.402 124.438Z"/>
    <path d="M192.747 17.2166C192.646 12.1145 192.702 7.02373 192.893 1.92169H222.865C222.966 6.31574 223.168 10.721 223.46 15.1151C223.663 19.5091 223.764 23.9144 223.764 28.3085C223.966 34.1073 224.067 39.8499 224.067 45.5588C224.067 51.2676 224.123 57.0102 224.213 62.809C224.213 64.0115 224.359 65.214 224.662 66.4052C224.763 67.102 224.965 67.8099 225.257 68.5067C225.459 69.2035 225.56 69.9114 225.56 70.6082V120.1C225.56 120.505 225.56 120.954 225.56 121.449C225.459 122.044 225.358 122.595 225.257 123.101H193.791C192.994 118.1 192.646 113.099 192.747 108.109C192.848 103.007 192.893 97.9614 192.893 92.9605C192.691 87.9596 192.59 82.9138 192.59 77.8117V62.5169V32.2193C192.691 27.2184 192.736 22.2175 192.736 17.2278L192.747 17.2166Z"/>
    <path d="M292.49 68.9899C292.389 76.4856 292.636 84.0376 293.242 91.6344C293.837 99.1302 293.994 106.581 293.691 113.976C293.691 115.571 293.837 117.178 294.14 118.774C294.444 120.37 294.736 122.022 295.039 123.719H294.893C294.489 123.82 294.095 124.022 293.691 124.314C293.388 124.719 293.04 124.91 292.647 124.91C288.952 125.011 285.202 125.011 281.406 124.91H280.361C279.957 124.91 279.665 124.809 279.463 124.607C278.868 124.011 278.217 123.651 277.52 123.562C276.925 123.46 276.218 123.415 275.42 123.415C274.915 123.415 274.421 123.269 273.916 122.966C273.422 122.764 272.961 122.618 272.568 122.516C271.872 122.314 271.176 122.067 270.468 121.763C269.873 121.46 269.165 121.561 268.368 122.067C267.773 122.269 267.065 122.067 266.268 121.471C263.27 119.875 260.328 118.223 257.43 116.527C254.533 114.728 251.883 112.683 249.491 110.379C246.796 107.974 244.247 105.378 241.843 102.58C239.44 99.6808 237.542 96.4331 236.15 92.8369C235.454 90.9377 234.656 89.0385 233.758 87.1393C232.961 85.24 232.264 83.3408 231.658 81.4416C230.861 79.1378 230.153 76.8453 229.558 74.5415C228.963 72.1478 228.705 69.7429 228.806 67.3379C228.907 63.3372 228.907 59.4376 228.806 55.6392C228.401 51.4362 228.851 47.5366 230.153 43.9405C231.557 40.2432 233.051 36.5908 234.645 32.9947C235.948 29.893 237.542 27.0947 239.44 24.5999C241.439 22.1051 243.438 19.6552 245.437 17.2503C246.133 16.4524 246.886 15.7556 247.683 15.1488C248.48 14.452 249.278 13.9014 250.086 13.4968C252.388 12.0921 254.679 10.6985 256.981 9.2938C259.373 7.88905 261.776 6.54049 264.168 5.24812C265.37 4.65251 266.616 4.1468 267.919 3.75347C269.323 3.259 270.67 2.79824 271.962 2.40492C272.164 2.20263 272.366 2.15768 272.557 2.25882C272.86 2.25882 273.006 2.21387 273.006 2.11273C273.904 0.618078 275.005 -0.0899147 276.308 0.011227H308.076C308.38 1.31483 308.526 2.50606 308.526 3.60738C308.526 6.01231 308.47 8.40599 308.38 10.8109C308.38 13.1147 308.436 15.4073 308.526 17.711C308.627 20.307 308.728 22.9592 308.829 25.6563C309.031 28.3534 309.177 31.0056 309.278 33.6015C309.581 36.0964 308.526 37.4 306.134 37.5011C304.135 37.6023 302.091 37.6023 299.991 37.5011C297.891 37.4 295.701 37.355 293.399 37.355C293.096 32.253 292.849 27.2521 292.647 22.3636C292.445 17.4638 292.243 12.564 292.052 7.66429H291.299V22.6557C291.299 24.1504 291.355 25.6563 291.445 27.1509C291.546 28.6456 291.591 30.1964 291.591 31.8035C291.793 34.0061 291.894 36.2986 291.894 38.7036V45.6037C291.995 49.5033 292.097 53.4029 292.198 57.3024C292.4 61.1009 292.501 65.0004 292.501 69.0012L292.49 68.9899Z"/>
    <path d="M295.028 85.0378C295.23 81.8349 295.174 78.6433 294.882 75.4405C294.579 72.2377 294.478 69.0461 294.579 65.8433H320.216C320.317 66.2479 320.419 66.6412 320.52 67.0458C320.722 67.4503 320.868 67.8998 320.969 68.3943V73.9459C321.07 75.744 321.171 77.6432 321.272 79.6435C321.272 81.2393 320.419 82.0485 318.723 82.0485C317.42 82.0485 316.028 82.0035 314.523 81.9024C313.018 81.8012 311.581 81.7563 310.177 81.7563H312.266C312.468 84.6557 312.569 87.5101 312.569 90.3084V98.557C312.67 100.153 312.715 101.805 312.715 103.502V108.604C312.614 110.503 312.569 112.447 312.569 114.448C312.569 116.448 312.468 118.448 312.266 120.449C312.165 121.044 312.019 121.651 311.817 122.247C311.716 122.842 311.614 123.55 311.513 124.348C308.717 123.753 305.921 123.696 303.125 124.202C300.43 124.697 297.734 124.55 295.028 123.753C295.028 120.55 294.983 117.358 294.882 114.155V104.558C294.882 101.355 294.826 98.1075 294.736 94.8148C294.736 91.5108 294.837 88.2631 295.039 85.0715L295.028 85.0378Z"/>
    <path d="M446.898 60.9885C447.101 58.932 446.999 56.9878 446.584 55.1448C443.799 43.255 439.195 32.8711 432.794 24.0043C426.494 15.1376 417.813 8.15878 406.752 3.07922C404.169 2.00037 401.485 1.46095 398.689 1.46095C394.242 1.34857 389.694 1.30362 385.045 1.30362H371.401C370.57 1.416 369.694 1.416 368.762 1.30362C367.83 1.30362 367.01 1.51714 366.28 1.95542C362.866 3.79845 359.408 5.47291 355.893 6.9788C352.378 8.59706 349.121 10.8222 346.123 13.6317C337.442 22.3861 331.243 32.5002 327.526 43.963C326.695 46.7725 326.078 49.6943 325.662 52.7174C325.247 55.8527 324.831 58.9319 324.427 61.9662C324.225 63.045 324.326 64.0228 324.741 64.8881C324.741 64.9106 324.764 64.933 324.775 64.9555C324.719 66.5738 324.64 68.0909 324.528 69.5181C324.213 72.1141 324.371 74.5977 324.988 76.9801C326.74 84.1162 329.379 90.7129 332.894 96.7702C336.409 102.929 341.002 108.289 346.684 112.829C351.749 116.616 356.971 119.752 362.338 122.235C367.706 124.719 373.602 125.528 380.003 124.674C381.451 124.461 382.9 124.348 384.338 124.348H388.526C390.076 124.348 391.682 124.404 393.333 124.506C395.084 124.719 396.69 124.618 398.139 124.18C405.786 122.022 412.917 118.988 419.532 115.099C426.146 111.211 431.772 105.581 436.421 98.2311C439.835 92.8257 442.362 87.1505 444.012 81.1944C445.764 75.2495 446.696 69.0798 446.797 62.7079C446.921 62.2134 446.921 61.7077 446.831 61.2133C446.831 61.1458 446.831 61.0672 446.842 60.9997L446.898 60.9885ZM387.392 61.8313C387.392 61.8313 387.392 61.9213 387.392 61.9662C387.392 62.2696 387.392 62.5731 387.392 62.8877C387.392 66.7985 387.358 70.5857 387.313 74.2268C387.268 77.8792 387.201 81.3517 387.1 84.6669C386.965 89.1733 386.808 92.6234 386.628 95.0171C386.437 97.3995 386.247 99.265 386.022 100.591C385.977 100.861 385.932 100.928 385.887 100.793C385.842 100.726 385.797 100.692 385.752 100.692H385.64C385.64 100.692 385.562 100.76 385.517 100.895C385.337 101.423 385.169 100.928 385.023 99.3999C384.877 97.8715 384.719 95.9498 384.585 93.6348C384.427 90.8478 384.293 87.5663 384.192 83.7903C384.09 80.0818 384.023 76.0361 383.967 71.6533C383.944 70.1924 383.944 68.664 383.956 67.0795C383.956 66.2142 383.956 65.2702 383.956 64.2812C383.956 64.27 383.956 64.2588 383.956 64.2363C383.944 63.7081 383.944 63.1125 383.956 62.4494C383.967 60.5952 383.978 58.7072 383.989 56.7743C384.001 54.92 384.023 53.1219 384.046 51.4025C384.147 44.3675 384.326 38.1754 384.573 32.8037C384.663 31.0843 384.753 29.7245 384.843 28.7243C384.944 27.7915 385.034 26.7689 385.135 25.6451C385.157 25.3754 385.18 25.2517 385.202 25.2517C385.225 25.3192 385.258 25.3192 385.281 25.2517H385.663C385.797 25.2517 385.921 25.2855 386.044 25.3529C386.123 25.3529 386.202 25.69 386.269 26.3531C386.583 29.466 386.819 33.7477 386.999 39.1868C387.179 44.626 387.313 50.9867 387.392 58.2801C387.403 59.4039 387.403 60.6064 387.392 61.8651V61.8313Z"/>
  </svg>
);

const chapters = [
  { name: 'Rhythm', id: 'rhythm', image: '/chapters/01_rhythm/cover-desktop.jpg' },
  { name: 'Pulse', id: 'pulse', image: '/chapters/02_pulse/cover-desktop.jpg' },
  { name: 'Whisper', id: 'whisper', image: '/chapters/03_whisper/cover-desktop.jpg' },
  { name: 'Resonance', id: 'resonance', image: '/chapters/04_resonance/cover-desktop.jpg' },
  { name: 'Sub-noise', id: 'sub-noise', image: '/chapters/05_subnoise/cover-desktop.jpg' }
];

function MagneticLink({ children, href, onMouseEnter, onMouseLeave }: { children: ReactNode, href: string, onMouseEnter: () => void, onMouseLeave: () => void }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const springConfig = { stiffness: 150, damping: 15, mass: 0.1 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const handleMouseMove = (e: MouseEvent) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { width, height, left, top } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    
    // Calculate movement (e.g., max 20px)
    x.set((clientX - centerX) * 0.2);
    y.set((clientY - centerY) * 0.2);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    onMouseLeave();
  };

  return (
    <motion.a
      ref={ref}
      href={href}
      onMouseEnter={onMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="indigo-chapter-link inline-block relative text-[40px] md:text-[50px] lg:text-[60px] uppercase font-sans font-normal tracking-[-3px] leading-[1] transition-colors duration-300 py-0.5 px-2"
      style={{ x: springX, y: springY }}
    >
      {children}
    </motion.a>
  );
}

export default function App() {
  const [hoveredChapter, setHoveredChapter] = useState<string | null>(null);
  const [phase, setPhase] = useState<'initial' | 'purple-up' | 'black-out' | 'done'>('initial');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('purple-up'), 1500); 
    const t2 = setTimeout(() => setPhase('black-out'), 2500); 
    const t3 = setTimeout(() => setPhase('done'), 3800); 

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-black font-sans overflow-hidden">
      {/* Splash Backgrounds */}
      {phase !== 'done' && (
        <div className="fixed inset-0 z-40 pointer-events-none">
          {/* Black Background */}
          <motion.div
            className="absolute inset-0 bg-black z-40"
            initial={{ opacity: 1 }}
            animate={{ opacity: phase === 'black-out' ? 0 : 1 }}
            transition={{ duration: 1.0, ease: [0.76, 0, 0.24, 1] }}
          />

          {/* Purple Background */}
          <motion.div
            className="absolute inset-0 bg-[#6a15ff] z-50"
            initial={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' }}
            animate={{
              clipPath: (phase === 'purple-up' || phase === 'black-out')
                ? 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)'
                : 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)'
            }}
            transition={{ duration: 1.0, ease: [0.76, 0, 0.24, 1] }}
          />
        </div>
      )}

      {/* Unified Logo - Centered during Splash */}
      {(phase === 'initial' || phase === 'purple-up') && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
          <motion.div
            layoutId="main-logo"
            transition={{ duration: 1.0, ease: [0.76, 0, 0.24, 1] }}
            className="w-[80vw] max-w-[800px] text-white mix-blend-difference"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <LogoSVG />
          </motion.div>
        </div>
      )}
      
      {/* 1. 底层：循环播放的全屏背景视频和悬停图片切换 */}
      <div className="absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-700 bg-black">
        <video
          autoPlay
          loop
          muted
          playsInline
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${hoveredChapter ? 'opacity-0' : 'opacity-100'}`}
        >
          <source src="https://indigo-laboratory.it/pages/homepage/hero/hero-background-desktop.mp4" type="video/mp4" media="(min-width: 1024px)" />
          <source src="https://indigo-laboratory.it/pages/homepage/hero/hero-background-mobile.mp4" type="video/mp4" />
        </video>

        {chapters.map((chapter) => (
          <img
            key={chapter.id}
            src={`https://indigo-laboratory.it${chapter.image}`}
            alt={chapter.name}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
              hoveredChapter === chapter.id ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}

        {/* 增加一个非常淡的深色蒙层，保证文字在白底图片上也能通过 mix-blend-difference 被看清 */}
        <div className="absolute inset-0 bg-black/10 z-10 pointer-events-none transition-opacity duration-700"></div>
      </div>

      {/* 2. 顶层：带有 mix-blend-mode: difference 的 Logo */}
      <header className="fixed top-6 left-0 w-full flex justify-between items-start text-white mix-blend-difference z-20 pointer-events-none px-6 md:px-10">
        <div className="flex-1 pointer-events-auto">
          {/* Menu Button */}
          <button className="text-[14px] md:text-[18px] uppercase font-sans tracking-tight hover:opacity-80 transition flex flex-col gap-[5px] items-start pt-1">
            <span className="w-8 h-[2px] bg-current"></span>
            <span className="w-5 h-[2px] bg-current"></span>
          </button>
        </div>
        
        <div className="flex-[2] flex justify-center pointer-events-auto relative">
          <div className="w-full max-w-[280px] md:max-w-[400px]">
            {(phase === 'black-out' || phase === 'done') && (
              <a href="#" className="block w-full outline-none">
                <motion.div
                  layoutId="main-logo"
                  transition={{ duration: 1.0, ease: [0.76, 0, 0.24, 1] }}
                  className="text-white"
                >
                  <LogoSVG />
                </motion.div>
              </a>
            )}
          </div>
        </div>
        <div className="flex-1 flex justify-end gap-6 pointer-events-auto items-start pt-1">
          <button className="text-[14px] md:text-[16px] xl:text-[18px] uppercase hover:opacity-80 transition cursor-pointer font-sans font-medium tracking-tight whitespace-nowrap hidden sm:block">The maker</button>
          <button className="text-[14px] md:text-[16px] xl:text-[18px] uppercase hover:opacity-80 transition cursor-pointer font-sans font-medium tracking-tight whitespace-nowrap">Contact</button>
        </div>
      </header>

      {/* 3. 中间内容：页面中心标题和其他 */}
      
      {/* 4. 底层内容：菜单和滚动指示器 */}
      
      {/* Scroll Indicator - Bottom Left */}
      <div className="absolute bottom-6 left-6 md:bottom-12 md:left-12 z-20 text-white mix-blend-difference pointer-events-none">
        <div className="flex flex-col items-center gap-3">
          <div className="w-[1.5px] h-[60px] md:h-[80px] bg-white/30 overflow-hidden relative rounded-full">
            <style>{`
              @keyframes scroll-indicator { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
              .animate-scroll-indicator { animation: scroll-indicator 1.4s ease-in-out infinite; }
            `}</style>
            <div className="absolute inset-0 w-full h-full bg-white animate-scroll-indicator rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Chapters - Center Bottom */}
      <div className="absolute bottom-8 md:bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center z-20 text-white mix-blend-difference pointer-events-auto">
        <p className="text-[14px] md:text-[16px] text-white mb-6 uppercase tracking-[-0.96px] font-mono leading-none">
          5 tales of being
        </p>
        <ul className="flex flex-col items-center gap-2">
          {chapters.map((chapter) => (
            <li key={chapter.id} className="overflow-visible">
              <MagneticLink
                href={`#${chapter.id}`}
                onMouseEnter={() => setHoveredChapter(chapter.id)}
                onMouseLeave={() => setHoveredChapter(null)}
              >
                {chapter.name}
              </MagneticLink>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
