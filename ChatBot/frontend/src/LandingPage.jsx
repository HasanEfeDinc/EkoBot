import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [textIndex, setTextIndex] = useState(0);
  const [isWaiting, setIsWaiting] = useState(false);

  const texts = [
    "Talep artışına göre hangi hammadde sipariş edilmeli",
    "Tahmini ihtiyaç tarihlerini de belirtir misin?",
    "Üretim planlaması nasıl yapılmalı?",
    "Stok optimizasyonu önerileri neler?",
    "Hangi üretim hattı en verimli çalışıyor?",
    "İşçilik maliyetlerini nasıl azaltabiliriz?",
    "Hangi adımda en fazla hata yapılıyor ve nasıl düzeltebiliriz?",
    "Fire oranı en yüksek olan ürünler hangileri?"
  ];

  useEffect(() => {
    let timeout;

    if (isWaiting) {
      timeout = setTimeout(() => {
        setIsWaiting(false);
        setIsDeleting(true);
      }, 1500); // Yazı tamamlandığında 1.5 saniye bekle
      return;
    }

    if (isDeleting) {
      if (currentText === '') {
        setIsDeleting(false);
        setTextIndex((prev) => (prev + 1) % texts.length);
        return;
      }

      timeout = setTimeout(() => {
        setCurrentText(prev => prev.slice(0, -1));
      }, 30); // Silme hızı - daha hızlı
    } else {
      const fullText = texts[textIndex];
      if (currentText === fullText) {
        setIsWaiting(true);
        return;
      }

      timeout = setTimeout(() => {
        setCurrentText(fullText.slice(0, currentText.length + 1));
      }, 50); // Yazma hızı - daha hızlı
    }

    return () => clearTimeout(timeout);
  }, [currentText, isDeleting, textIndex, isWaiting, texts]);

  return (
    <div className="landing-container">
      <div className="left-section">
        <h1 className="logo">EkoBot + </h1>
        <div className="animated-text-container">
          <h2 className="typewriter">
            {currentText}
            <span className="cursor"></span>
          </h2>
        </div>
      </div>
      
      <div className="right-section">
        <h1 className="start-title">Başla</h1>
        <div className="buttons-container">
          <Link to="/login" className="auth-button login">Oturum aç</Link>
          <Link to="/register" className="auth-button register">Kaydol</Link>
        </div>
      </div>
    </div>
  );
};

export default LandingPage; 