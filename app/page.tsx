'use client';

import { useTheme } from '@/components/ThemeProvider';
import PrayerTimes from '@/components/PrayerTimes';
import { useState, useEffect, useRef } from 'react';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen p-2 sm:p-3 md:p-4 relative">
        <div className="container mx-auto max-w-md px-4 py-8 text-forced-dark">Loading...</div>
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
  
  // Ref to track last date to detect day change
  const lastDateRef = useRef<number>(new Date().getDate());

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

  // Function to get accurate Hijri date from API (works on all devices)
  const updateHijriDateFromAPI = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`https://api.aladhan.com/v1/gToH/${today}`);
      const data = await response.json();
      
      if (data?.data?.hijri) {
        const hijri = data.data.hijri;
        const day = hijri.day;
        const month = hijri.month.ar;
        const year = hijri.year;
        setHijriDate(`HIJRY ${day} ${month} ${year}`);
      } else {
        throw new Error('API response invalid');
      }
    } catch (err) {
      console.error('Hijri API failed:', err);
      // Fallback: Calculate approximate Hijri date
      const d = new Date();
      const hijriYear = d.getFullYear() - 622;
      const hijriMonths = ['Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani', 'Jumada al-Ula', 'Jumada al-Thani', 'Rajab', 'Sha\'ban', 'Ramadan', 'Shawwal', 'Dhul Qadah', 'Dhul Hijjah'];
      const monthIndex = (d.getMonth() + 6) % 12;
      setHijriDate(`HIJRY ${d.getDate()} ${hijriMonths[monthIndex]} ${hijriYear}`);
    }
  };

  // Function to fetch prayer times
  const fetchPrayerData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/prayers?city=Karachi&country=Pakistan&date=${today}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      
      // Calculate next prayer (handles next day Fajr)
      if (data?.data?.timings) {
        const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTimeMinutes = currentHour * 60 + currentMinute;
        
        let nextPrayerFound: string | null = null;
        let nextPrayerTimeMinutes: number | null = null;
        
        for (const prayer of prayers) {
          const prayerTimeStr = data.data.timings[prayer].split(' ')[0];
          const [hour, minute] = prayerTimeStr.split(':').map(Number);
          const prayerTimeMinutes = hour * 60 + minute;
          
          if (prayerTimeMinutes > currentTimeMinutes) {
            nextPrayerFound = prayer;
            nextPrayerTimeMinutes = prayerTimeMinutes;
            break;
          }
        }
        
        // If no prayer found today (after Isha), show Fajr for tomorrow
        if (!nextPrayerFound || !nextPrayerTimeMinutes) {
          const fajrTimeStr = data.data.timings['Fajr'].split(' ')[0];
          const [fajrHour, fajrMinute] = fajrTimeStr.split(':').map(Number);
          const fajrTimeMinutes = fajrHour * 60 + fajrMinute;
          const secondsInDay = 24 * 60;
          let diffMin = (fajrTimeMinutes + secondsInDay) - currentTimeMinutes;
          const hours = Math.floor(diffMin / 60);
          const minutes = diffMin % 60;
          
          setNextPrayer({
            name: 'Fajr (Next Day)',
            time: fajrTimeStr,
            remaining: `${hours > 0 ? `${hours}h ` : ''}${minutes}m`
          });
        } else {
          // Calculate remaining time for today's next prayer
          const diffMin = nextPrayerTimeMinutes - currentTimeMinutes;
          const hours = Math.floor(diffMin / 60);
          const minutes = diffMin % 60;
          const prayerTimeStr = data.data.timings[nextPrayerFound].split(' ')[0];
          setNextPrayer({
            name: nextPrayerFound,
            time: prayerTimeStr,
            remaining: `${hours > 0 ? `${hours}h ` : ''}${minutes}m`
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch prayer times:', err);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchPrayerData();
    updateHijriDateFromAPI();
  }, []);

  // Auto-sync: Refresh every hour AND check for date change
  useEffect(() => {
    // Refresh every hour
    const interval = setInterval(() => {
      fetchPrayerData();
      updateHijriDateFromAPI();
    }, 60 * 60 * 1000); // Every hour
    
    // Check for date change every minute
    const dateCheckInterval = setInterval(() => {
      const currentDate = new Date().getDate();
      if (currentDate !== lastDateRef.current) {
        lastDateRef.current = currentDate;
        fetchPrayerData(); // Refresh data when date changes
        updateHijriDateFromAPI(); // Update Hijri date
      }
    }, 60000); // Check every minute
    
    return () => {
      clearInterval(interval);
      clearInterval(dateCheckInterval);
    };
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
          <div className="glass-card-forced p-3 xs:p-4 sm:p-6 space-y-3 xs:space-y-4 sm:space-y-6 relative">
            
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
                <p className="text-large text-green-800 dark:text-green-200 font-bold">Next Prayer</p>
                <p className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold text-green-800 dark:text-green-200">{nextPrayer.name}</p>
                <p className="text-large xs:text-sm text-green-800 dark:text-green-200 font-bold">in {nextPrayer.remaining}</p>
              </div>
            )}

            {/* Prayer Times List */}
            <PrayerTimes />

            {/* Footer */}
            <div className="mt-3 xs:mt-4 sm:mt-6 text-center space-y-2 xs:space-y-3 sm:space-y-4">
              <button
                onClick={toggleTheme}
                className="px-3 xs:px-4 sm:px-6 py-1.5 xs:py-2 bg-amber-200 dark:bg-slate-700 rounded-xl shadow-md hover:scale-105 transition-all duration-300 font-bold text-sm xs:text-base"
                style={{ color: '#000000' }}
              >
                {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
              </button>
              <p className="text-[10px] xs:text-xs text-forced-dark border-t border-amber-200 dark:border-slate-700 pt-2 xs:pt-3">
                Designed By: Azmat Ali
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}