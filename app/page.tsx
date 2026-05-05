'use client';

import { useTheme } from '@/components/ThemeProvider';
import PrayerTimes from '@/components/PrayerTimes';
import { useState, useEffect } from 'react';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-amber-50 dark:bg-slate-900">
        <div className="container mx-auto max-w-md px-4 py-8">Loading...</div>
      </div>
    );
  }

  return <HomeContent />;
}

function HomeContent() {
  const { theme, toggleTheme } = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [gregorianDate, setGregorianDate] = useState('');
  const [hijriDate, setHijriDate] = useState('');
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: string; remaining: string } | null>(null);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Update gregorian date when time changes
  useEffect(() => {
    const date = currentTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    setGregorianDate(date);
  }, [currentTime]);

  // Fetch prayer times
  useEffect(() => {
    fetch('/api/prayers?city=Karachi&country=Pakistan')
      .then(res => res.json())
      .then(data => {
        if (data?.data?.date?.hijri) {
          const hijri = data.data.date.hijri;
          // Format: HIJRY 26 رَبيع الأوّل 1426
          setHijriDate(`HIJRY ${hijri.day} ${hijri.month.ar} ${hijri.year}`);
        }
        
        // Calculate next prayer
        if (data?.data?.timings) {
          const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
          const now = new Date();
          const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
          
          for (const prayer of prayers) {
            const prayerTime = data.data.timings[prayer].split(' ')[0];
            if (prayerTime > currentTimeStr) {
              const [pHour, pMin] = prayerTime.split(':').map(Number);
              const [cHour, cMin] = currentTimeStr.split(':').map(Number);
              let diffMin = (pHour * 60 + pMin) - (cHour * 60 + cMin);
              const hours = Math.floor(diffMin / 60);
              const minutes = diffMin % 60;
              setNextPrayer({
                name: prayer,
                time: prayerTime,
                remaining: `${hours > 0 ? `${hours}h ` : ''}${minutes}m`
              });
              break;
            }
          }
        }
      })
      .catch(console.error);
  }, []);

  // Format time to 12-hour with AM/PM
  const formatTime12Hour = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="min-h-screen p-2 sm:p-3 md:p-4 relative">
      {/* Corner Flowers Decorations */}
      <div className="corner-flower corner-flower-tl w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 hidden xs:block"></div>
      <div className="corner-flower corner-flower-tr w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 hidden xs:block"></div>
      <div className="corner-flower corner-flower-bl w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 hidden xs:block"></div>
      <div className="corner-flower corner-flower-br w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 hidden xs:block"></div>

      {/* Oil Painting Frame */}
      <div className="oil-painting-frame max-w-[98%] xs:max-w-[95%] sm:max-w-md mx-auto relative z-10">
        <div className="oil-painting-frame-inner">
          <div className="glass-card p-3 xs:p-4 sm:p-6 space-y-3 xs:space-y-4 sm:space-y-6 relative">
            
            {/* Decorative inner border */}
            <div className="absolute inset-1 xs:inset-2 rounded-2xl border border-amber-300/40 dark:border-amber-700/30 pointer-events-none"></div>
            
            {/* Header - Date */}
            <div className="text-center relative">
              <p className="text-date-large">
                {gregorianDate}
              </p>
              
              {/* Clock - 12 Hour Format with AM/PM */}
              <h1 className="my-2 xs:my-3 sm:my-4 leading-tight">
                <span className="text-clock-digits break-words">
                  {formatTime12Hour(currentTime)}
                </span>
              </h1>
              
              {/* Hijri Date */}
              {hijriDate && (
                <p className="text-hijri-large break-words">
                  {hijriDate}
                </p>
              )}
            </div>

            {/* Next Prayer Banner */}
            {nextPrayer && (
              <div className="bg-gradient-to-r from-amber-200 to-orange-200 dark:from-amber-900/50 dark:to-orange-900/50 rounded-xl p-2 xs:p-3 sm:p-4 text-center animate-pulse-subtle">
                <p className="text-xs text-forced-dark font-semibold">Next Prayer</p>
                <p className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-amber-200">{nextPrayer.name}</p>
                <p className="text-xs xs:text-sm text-gray-700 dark:text-amber-300 font-medium">in {nextPrayer.remaining}</p>
              </div>
            )}

            {/* Prayer Times List */}
            <PrayerTimes />

            {/* Footer */}
            <div className="mt-3 xs:mt-4 sm:mt-6 text-center space-y-2 xs:space-y-3 sm:space-y-4">
              <button
                onClick={toggleTheme}
                className="px-3 xs:px-4 sm:px-6 py-1.5 xs:py-2 bg-amber-200 dark:bg-slate-700 rounded-xl shadow-md text-gray-800 dark:text-amber-200 hover:scale-105 transition-all duration-300 font-medium text-sm xs:text-base"
              >
                {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
              </button>
              <p className="text-[10px] xs:text-xs text-gray-600 dark:text-gray-400 border-t border-amber-200 dark:border-slate-700 pt-2 xs:pt-3">
                Designed By: Azmat Ali
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
