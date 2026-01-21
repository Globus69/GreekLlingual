"use client";

import React, { useEffect } from "react";
import styles from "./page.module.css";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push("/dashboard");
  }, [router]);

  const handleGetStarted = () => {
    router.push("/student-mockup-complex");
  };

  const handleLearnMore = () => {
    alert("Hellenic Horicons: Master new languages with ease!");
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className="glass" style={{ padding: '40px', borderRadius: '28px', textAlign: 'center', maxWidth: '600px' }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '20px', fontWeight: 700 }}>Hellenic Horicons</h1>
          <p style={{ fontSize: '1.2rem', marginBottom: '40px', opacity: 0.8 }}>
            Master new languages with spaced repetition and immersive media.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button className="btn-primary" onClick={handleGetStarted}>Get Started</button>
            <button className="glass" style={{ padding: '12px 24px', borderRadius: '12px', fontWeight: 600, cursor: 'pointer' }} onClick={handleLearnMore}>
              Learn More
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
