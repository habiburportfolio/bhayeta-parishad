import React, { useState } from 'react';
import { FileText, Receipt, BookOpen, Shield, Settings, Globe, Menu, X, Printer, Lock, Cloud } from 'lucide-react';
import { Language, OrganizationProfile } from '../types';
import { TRANSLATIONS } from '../data/translations';

interface NavbarProps {
  currentTab: 'form' | 'receipt' | 'pad' | 'admin';
  setCurrentTab: (tab: 'form' | 'receipt' | 'pad' | 'admin') => void;
  lang: Language;
  toggleLang: () => void;
  org: OrganizationProfile;
  openSettings: () => void;
  onQuickPrint?: () => void;
  isAdminUnlocked?: boolean;
  onLockAdmin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  lang,
  toggleLang,
  org,
  openSettings,
  onQuickPrint,
  isAdminUnlocked = false,
  onLockAdmin,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = TRANSLATIONS[lang];

  const navItems = [
    { id: 'form' as const, label: t.navAdmissionForm, icon: FileText, adminOnly: false },
    { id: 'receipt' as const, label: t.navReceiptBook, icon: Receipt, adminOnly: true },
    { id: 'pad' as const, label: t.navPadBook, icon: BookOpen, adminOnly: true },
    { id: 'admin' as const, label: t.navAdmin, icon: Shield, adminOnly: true },
  ];

  const handleTabClick = (tabId: 'form' | 'receipt' | 'pad' | 'admin', adminOnly: boolean) => {
    if (adminOnly && !isAdminUnlocked) {
      setCurrentTab('admin');
    } else {
      setCurrentTab(tabId);
    }
  };

  return (
    <header className="no-print sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full border-2 border-emerald-600 bg-emerald-50 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
              {org.logoUrl ? (
                <img src={org.logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-emerald-800 font-bold text-base">ভা</span>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-emerald-900 leading-tight truncate">
                {lang === 'bn' ? org.nameBn : org.nameEn}
              </h1>
              <p className="text-xs text-slate-500 font-medium truncate hidden sm:block">
                {t.appSubTitle}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              const isLocked = item.adminOnly && !isAdminUnlocked;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id, item.adminOnly)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'text-slate-700 hover:text-emerald-800 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-200' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                  {isLocked && <Lock className="w-3 h-3 text-slate-400 ml-0.5" />}
                </button>
              );
            })}
          </nav>

          {/* Action Tools & 1-Click Language Switcher */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Cloud Status Badge */}
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold" title="Supabase Cloud Live Database Connected">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>ক্লাউড লাইভ</span>
            </div>

            {/* Quick Print Button */}
            {onQuickPrint && (
              <button
                onClick={onQuickPrint}
                title={t.printNow}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>{t.printNow}</span>
              </button>
            )}

            {/* 1-Click Language Toggle */}
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-300 hover:bg-emerald-100 transition-colors cursor-pointer shadow-2xs"
              title={lang === 'bn' ? 'Switch to English' : 'বাংলা ভাষায় পরিবর্তন করুন'}
            >
              <Globe className="w-3.5 h-3.5 text-emerald-700" />
              <span className="font-semibold">{t.toggleLang}</span>
            </button>

            {/* Admin Lock / Unlock Status Button */}
            {isAdminUnlocked && onLockAdmin ? (
              <button
                onClick={onLockAdmin}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 cursor-pointer"
                title="লক করুন (সাধারণ ইউজার মোড)"
              >
                <Lock className="w-3.5 h-3.5 text-red-600" />
                <span className="hidden sm:inline">লক</span>
              </button>
            ) : null}

            {/* Settings Trigger */}
            <button
              onClick={() => {
                if (isAdminUnlocked) {
                  openSettings();
                } else {
                  setCurrentTab('admin');
                }
              }}
              className="p-2 text-slate-600 hover:text-emerald-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title={isAdminUnlocked ? t.navSettings : 'সংগঠনের সেটিংস (অ্যাডমিন)'}
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 border-t border-slate-200 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              const isLocked = item.adminOnly && !isAdminUnlocked;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    handleTabClick(item.id, item.adminOnly);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-800 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {isLocked && <Lock className="w-3.5 h-3.5 opacity-60" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};
