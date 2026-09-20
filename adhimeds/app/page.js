"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const [animationComplete, setAnimationComplete] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + Math.random() * 15;
        return newProgress >= 100 ? 100 : newProgress;
      });
    }, 200);

    const timer = setTimeout(() => {
      setAnimationComplete(true);
    }, 3500);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (animationComplete) {
      setTimeout(() => {
        router.push("/login");
      }, 500);
    }
  }, [animationComplete, router]);

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        margin: 0,
        padding: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #0a2b1e 0%, #1a4a2a 40%, #2d6f3a 100%)",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      {/* Animated Background Particles */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: `${Math.random() * 6 + 2}px`,
              height: `${Math.random() * 6 + 2}px`,
              background: "rgba(255,255,255,0.08)",
              borderRadius: "50%",
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `float ${Math.random() * 8 + 6}s linear infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Logo / Icon – Hospital + Doctor */}
      <div
        style={{
          marginBottom: "2rem",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <div
          style={{
            width: "110px",
            height: "110px",
            background: "rgba(255,255,255,0.06)",
            borderRadius: "50%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            border: "2px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(10px)",
            animation: "pulse 2s ease-in-out infinite",
            position: "relative",
          }}
        >
          <span
            style={{
              fontSize: "3.5rem",
              color: "#fff",
              fontWeight: "bold",
              letterSpacing: "2px",
              lineHeight: 1,
            }}
          >
            🏥
          </span>
          {/* Small stethoscope accent */}
          <span
            style={{
              position: "absolute",
              bottom: "2px",
              right: "2px",
              fontSize: "1.2rem",
              color: "#4ade80",
              background: "rgba(0,0,0,0.3)",
              borderRadius: "50%",
              padding: "4px",
              lineHeight: 1,
            }}
          >
            🩺
          </span>
        </div>
      </div>

      {/* Main Title */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <h1
          style={{
            fontSize: "4.5rem",
            fontWeight: 900,
            color: "#ffffff",
            margin: 0,
            letterSpacing: "8px",
            textShadow: "0 4px 20px rgba(0,0,0,0.3)",
            animation: "fadeInDown 1.2s ease-out",
          }}
        >
          <span style={{ color: "#4ade80" }}>ADHI</span>
          <span style={{ color: "#ffffff" }}>MEDS</span>
        </h1>
        <p
          style={{
            fontSize: "1.2rem",
            color: "rgba(255,255,255,0.7)",
            letterSpacing: "6px",
            marginTop: "0.5rem",
            fontWeight: 300,
            animation: "fadeInUp 1.2s ease-out 0.3s both",
          }}
        >
          HEALTHCARE AT YOUR FINGERTIPS
        </p>
        <p
          style={{
            fontSize: "0.85rem",
            color: "rgba(255,255,255,0.35)",
            letterSpacing: "4px",
            marginTop: "0.3rem",
            fontWeight: 300,
            animation: "fadeInUp 1.2s ease-out 0.6s both",
          }}
        >
          TRUSTED • RELIABLE • CARING
        </p>
      </div>

      {/* Loading Bar */}
      <div
        style={{
          width: "320px",
          maxWidth: "80%",
          height: "4px",
          background: "rgba(255,255,255,0.15)",
          borderRadius: "4px",
          overflow: "hidden",
          marginTop: "1.5rem",
          animation: "fadeIn 1.5s ease-out 0.6s both",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            background: "linear-gradient(90deg, #4ade80, #22c55e, #16a34a)",
            borderRadius: "4px",
            transition: "width 0.3s ease",
            boxShadow: "0 0 20px rgba(74, 222, 128, 0.4)",
          }}
        />
      </div>

      {/* Loading Text */}
      <p
        style={{
          color: "rgba(255,255,255,0.5)",
          fontSize: "0.8rem",
          marginTop: "1rem",
          letterSpacing: "3px",
          animation: "fadeIn 1.5s ease-out 0.8s both",
        }}
      >
        {progress < 100 ? "LOADING..." : "WELCOME!"}
      </p>

      {/* Footer */}
      <div
        style={{
          position: "absolute",
          bottom: "2rem",
          color: "rgba(255,255,255,0.2)",
          fontSize: "0.7rem",
          letterSpacing: "2px",
        }}
      >
        © 2026 ADHIMEDS • ALL RIGHTS RESERVED
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0) scale(1);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-80px) scale(1.5);
            opacity: 0.8;
          }
        }

        @keyframes pulse {
          0%,
          100% {
            transform: scale(1);
            box-shadow: 0 0 20px rgba(74, 222, 128, 0.1);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 0 40px rgba(74, 222, 128, 0.2);
          }
        }

        @keyframes fadeInDown {
          0% {
            opacity: 0;
            transform: translateY(-30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}