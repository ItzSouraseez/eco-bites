'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import ProtectedRoute from '@/components/ProtectedRoute';
import UserMenu from '@/components/UserMenu';
import Link from 'next/link';
import Image from 'next/image';

function ProfileContent() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalContributions: 0,
    totalScans: 0,
    points: 0,
    level: 1,
    nextLevelPoints: 100,
  });
  const [recentContributions, setRecentContributions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !db) return;

    const fetchUserStats = async () => {
      try {
        // Get total contributions
        const contributionsQuery = query(
          collection(db, 'sharedProducts'),
          where('userId', '==', user.uid)
        );
        const contributionsSnapshot = await getDocs(contributionsQuery);
        const contributionsCount = contributionsSnapshot.size;

        // Get total scans
        const scansQuery = query(
          collection(db, 'scans'),
          where('userId', '==', user.uid)
        );
        const scansSnapshot = await getDocs(scansQuery);
        const scansCount = scansSnapshot.size;

        // Calculate points (10 points per contribution, 1 point per scan)
        const points = (contributionsCount * 10) + scansCount;

        // Calculate level (every 100 points = 1 level)
        const level = Math.floor(points / 100) + 1;
        const nextLevelPoints = level * 100;
        const progressToNextLevel = (points % 100) / 100;

        setStats({
          totalContributions: contributionsCount,
          totalScans: scansCount,
          points: points,
          level: level,
          nextLevelPoints: nextLevelPoints,
          progressToNextLevel: progressToNextLevel,
        });

        // Get recent contributions
        const recentQuery = query(
          collection(db, 'sharedProducts'),
          where('userId', '==', user.uid),
          orderBy('timestamp', 'desc'),
          limit(5)
        );
        const recentSnapshot = await getDocs(recentQuery);
        const recent = recentSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRecentContributions(recent);
      } catch (error) {
        console.error('Error fetching user stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, [user]);

  const getLevelTitle = (level) => {
    if (level >= 20) return 'Master Contributor';
    if (level >= 15) return 'Expert Contributor';
    if (level >= 10) return 'Advanced Contributor';
    if (level >= 5) return 'Pro Contributor';
    if (level >= 3) return 'Active Contributor';
    return 'New Contributor';
  };

  const getBadges = () => {
    const badges = [];
    if (stats.totalContributions >= 1) badges.push({ name: 'First Contribution', icon: '🎉', color: 'yellow' });
    if (stats.totalContributions >= 5) badges.push({ name: 'Contributor', icon: '⭐', color: 'blue' });
    if (stats.totalContributions >= 10) badges.push({ name: 'Super Contributor', icon: '🌟', color: 'purple' });
    if (stats.totalContributions >= 25) badges.push({ name: 'Elite Contributor', icon: '💎', color: 'pink' });
    if (stats.totalContributions >= 50) badges.push({ name: 'Legendary Contributor', icon: '👑', color: 'gold' });
    if (stats.totalScans >= 10) badges.push({ name: 'Scanner', icon: '📸', color: 'green' });
    if (stats.totalScans >= 50) badges.push({ name: 'Super Scanner', icon: '📷', color: 'blue' });
    if (stats.level >= 5) badges.push({ name: 'Level 5', icon: '🏆', color: 'orange' });
    if (stats.level >= 10) badges.push({ name: 'Level 10', icon: '🥇', color: 'gold' });
    return badges;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  const badges = getBadges();

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <header className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <Link
              href="/scanner"
              className="inline-flex items-center gap-2 px-4 py-2 text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 font-semibold rounded-2xl hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-all duration-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Scanner
            </Link>
            <UserMenu />
          </div>
        </header>

        {/* Profile Header Card */}
        <div className="bg-gradient-to-r from-yellow-500 via-yellow-600 to-black rounded-3xl shadow-2xl p-8 mb-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="relative">
                {user?.photoURL ? (
                  <Image
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    width={120}
                    height={120}
                    className="rounded-full ring-4 ring-white/50 shadow-xl"
                  />
                ) : (
                  <div className="w-30 h-30 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl font-bold ring-4 ring-white/50 shadow-xl text-white">
                    {user?.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-yellow-900 rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg shadow-lg">
                  {stats.level}
                </div>
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-4xl md:text-5xl font-bold mb-2 text-white">
                  {user?.displayName || user?.email?.split('@')[0] || 'User'}
                </h1>
                <p className="text-xl md:text-2xl text-white/90 mb-4">
                  {getLevelTitle(stats.level)}
                </p>
                
                {/* Points Display */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 mb-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-3">
                    <div className="text-sm text-white/80">Total Points</div>
                    <div className="text-3xl font-bold text-white">{stats.points}</div>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-3">
                    <div className="text-sm text-white/80">Contributions</div>
                    <div className="text-3xl font-bold text-white">{stats.totalContributions}</div>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-3">
                    <div className="text-sm text-white/80">Scans</div>
                    <div className="text-3xl font-bold text-white">{stats.totalScans}</div>
                  </div>
                </div>

                {/* Level Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-2 text-white/90">
                    <span>Level {stats.level}</span>
                    <span>{stats.points % 100} / 100 to Level {stats.level + 1}</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-white h-full rounded-full transition-all duration-500 shadow-lg"
                      style={{ width: `${(stats.points % 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Badges Section */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>🏆</span>
              Achievements & Badges
            </h2>
            {badges.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {badges.map((badge, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 text-center border border-gray-200/50"
                  >
                    <div className="text-4xl mb-2">{badge.icon}</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {badge.name}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Start contributing to earn your first badge! 🎯
              </p>
            )}
          </div>

          {/* Recent Contributions */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>📝</span>
              Recent Contributions
            </h2>
            {recentContributions.length > 0 ? (
              <div className="space-y-3">
                {recentContributions.map((contribution) => (
                  <div
                    key={contribution.id}
                    className="bg-gray-50 rounded-2xl p-4 border border-gray-200/50"
                  >
                    <div className="font-semibold text-gray-900">
                      {contribution.productName}
                    </div>
                    {contribution.brand && (
                      <div className="text-sm text-gray-600">
                        {contribution.brand}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-2">
                      +10 points
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No contributions yet. Start contributing to build your profile! 🚀
              </p>
            )}
          </div>
        </div>

        {/* Points System Info */}
        <div className="mt-6 bg-yellow-50 backdrop-blur-sm border border-yellow-200/50 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-3">
            💰 How to Earn Points
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-yellow-800">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📦</span>
              <div>
                <div className="font-semibold">Contribute a Product</div>
                <div className="text-yellow-600">Earn 10 points per contribution</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">📸</span>
              <div>
                <div className="font-semibold">Scan a Product</div>
                <div className="text-yellow-600">Earn 1 point per scan</div>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-yellow-200/50">
            <p className="text-sm text-yellow-700">
              <strong>Level Up:</strong> Every 100 points = 1 level. Higher levels unlock exclusive badges and recognition!
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <div className="mt-6 text-center">
          <Link
            href="/dataset"
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Contribute More Products
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}

