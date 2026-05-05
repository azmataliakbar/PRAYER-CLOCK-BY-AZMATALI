'use client';

import { useEffect, useState } from 'react';
import { PrayerTimesData } from '@/lib/types';

interface PrayerTimesProps {
  city?: string;
  country?: string;
}

export default function PrayerTimes({ city = 'Karachi', country = 'Pakistan' }: PrayerTimesProps) {
  const [prayerData, setPrayerData] = useState<PrayerTimesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextPrayerName, setNextPrayerName] = useState<string | null>(null);

  const prayers = [
    { name: 'Fajr', arabic: 'فجر' },
    { name: 'Dhuhr', arabic: 'ظہر' },
    { name: 'Asr', arabic: 'عصر' },
    { name: 'Maghrib', arabic: 'مغرب' },
    { name: 'Isha', arabic: 'عشاء' },
  ];

  // Helper function to convert 24-hour time to 12-hour format with AM/PM
  const convertTo12Hour = (time24: string): string => {
    if (!time24) return '--:--';
    
    // Handle time format like "17:06" or "17:06 (UTC)"
    const timePart = time24.split(' ')[0];
    const [hourStr, minuteStr] = timePart.split(':');
    let hour = parseInt(hourStr, 10);
    const minute = minuteStr;
    
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    hour = hour === 0 ? 12 : hour; // Convert 0 to 12 for midnight
    
    return `${hour}:${minute} ${ampm}`;
  };

  useEffect(() => {
    fetchPrayerTimes();
  }, [city, country]);

  const fetchPrayerTimes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/prayers?city=${city}&country=${country}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setPrayerData(data);
      
      // Determine next prayer
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = currentHour * 60 + currentMinute;
      
      for (const prayer of prayers) {
        const timeStr = data.data.timings[prayer.name].split(' ')[0];
        const [hour, minute] = timeStr.split(':').map(Number);
        const prayerTime = hour * 60 + minute;
        
        if (prayerTime > currentTime) {
          setNextPrayerName(prayer.name);
          break;
        }
      }
    } catch (err) {
      setError('Unable to load prayer times');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10 sm:py-20">
        <div className="animate-pulse text-gray-700 dark:text-amber-400">Loading prayer times...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 sm:py-20">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button onClick={fetchPrayerTimes} className="mt-4 px-4 py-2 bg-amber-500 text-white rounded-lg shadow-md">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 xs:space-y-2 sm:space-y-3">
      {prayers.map((prayer) => {
        const isNext = nextPrayerName === prayer.name;
        const timeStr = prayerData?.data.timings[prayer.name as keyof typeof prayerData.data.timings] || '--:--';
        const displayTime12Hour = convertTo12Hour(timeStr);
        
        return (
          <div
            key={prayer.name}
            className={`p-2 xs:p-3 sm:p-4 rounded-xl flex justify-between items-center transition-all duration-300 ${
              isNext 
                ? 'bg-gradient-to-r from-amber-300 to-amber-200 dark:from-amber-800/50 dark:to-amber-700/50 border-2 border-amber-500 dark:border-amber-500 shadow-lg' 
                : 'glass-card hover:scale-[1.01]'
            }`}
          >
            <div className="flex flex-col">
              <span className={`text-sm xs:text-base sm:text-lg font-semibold ${isNext ? 'text-gray-800 dark:text-amber-200' : 'text-gray-800 dark:text-amber-100'}`}>
                {prayer.name}
              </span>
              <span className="text-base xs:text-3xl sm:text-xl md:text-3xl font-arabic text-emerald-500 dark:text-emerald-300" style={{ fontFamily: "'Amiri', 'Noto Naskh Arabic', serif" }}>
                {prayer.arabic}
              </span>
            </div>
            <div className={`text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl font-mono font-bold ${isNext ? 'text-gray-800 dark:text-amber-200' : 'text-gray-800 dark:text-amber-100'}`}>
              {displayTime12Hour}
            </div>
          </div>
        );
      })}
    </div>
  );
}