import React, { useState, useEffect } from "react";
import DashboardLayout from "./components/DashboardLayout";
import Overview from "./components/Overview";
import ModelPlayground from "./components/ModelPlayground";
import ChatAssistants from "./components/ChatAssistants";
import AnalyticsView from "./components/AnalyticsView";
import SettingsView from "./components/SettingsView";
import VideoStudio from "./components/VideoStudio";
import MultimodalHub from "./components/MultimodalHub";
import { ActiveTab, MetricsData } from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [apiActive, setApiActive] = useState(true); // Default to true, updated via health endpoint
  const [nvidiaActive, setNvidiaActive] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [preselectedPlaygroundModel, setPreselectedPlaygroundModel] = useState<string | null>(null);
  const [preselectedChatModel, setPreselectedChatModel] = useState<string | null>(null);
  
  // Real-time metrics and historical runs synchronized from Express server
  const [metrics, setMetrics] = useState<MetricsData>({
    totalTokensUsed: 1248390,
    totalRuns: 452,
    totalLatencySum: 144640,
    totalCostSavings: 142.30,
    history: []
  });

  // 1. Fetch metrics telemetry from the server proxy
  const fetchMetrics = async (showLoading = false) => {
    if (showLoading) setIsRefreshing(true);
    try {
      const response = await fetch("/api/metrics");
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error("Telemetry sync failed:", error);
    } finally {
      if (showLoading) setIsRefreshing(false);
    }
  };

  // 2. Query gateway API health check
  const checkHealth = async () => {
    try {
      const clientKey = localStorage.getItem("nvidia_api_key") || "";
      const response = await fetch("/api/health", {
        headers: {
          "x-nvidia-api-key": clientKey
        }
      });
      if (response.ok) {
        const data = await response.json();
        setApiActive(data.apiActive);
        setNvidiaActive(data.nvidiaActive);
      }
    } catch (error) {
      console.error("Health diagnostics check failed:", error);
      setApiActive(false);
      setNvidiaActive(false);
    }
  };

  // 3. Purge metrics state
  const resetMetrics = async () => {
    try {
      const response = await fetch("/api/metrics/reset", { method: "POST" });
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics);
      }
    } catch (error) {
      console.error("Failed to reset metrics logs:", error);
    }
  };

  // Initial synchronization on app loading
  useEffect(() => {
    checkHealth();
    fetchMetrics();
    
    // Refresh health and metrics telemetry periodically in background (e.g., every 30s)
    const interval = setInterval(() => {
      checkHealth();
      fetchMetrics();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    checkHealth();
    fetchMetrics(true);
  };

  return (
    <DashboardLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      metrics={metrics}
      apiActive={apiActive}
      nvidiaActive={nvidiaActive}
      onRefreshMetrics={handleManualRefresh}
      isRefreshing={isRefreshing}
    >
      {/* Tab routing container */}
      <div className="animate-fade-in">
        {activeTab === "overview" && (
          <Overview 
            metrics={metrics} 
            setActiveTab={setActiveTab} 
            setSelectedPlaygroundModel={setPreselectedPlaygroundModel}
            setSelectedChatModel={setPreselectedChatModel}
          />
        )}

        {activeTab === "multimodal" && (
          <MultimodalHub />
        )}

        {activeTab === "video" && (
          <VideoStudio />
        )}
        
        {activeTab === "playground" && (
          <ModelPlayground 
            onEvaluationCompleted={fetchMetrics} 
            preselectedModelId={preselectedPlaygroundModel}
            onClearPreselected={() => setPreselectedPlaygroundModel(null)}
          />
        )}
        
        {activeTab === "chat" && (
          <ChatAssistants 
            onChatCompleted={fetchMetrics} 
            preselectedModelId={preselectedChatModel}
            onClearPreselected={() => setPreselectedChatModel(null)}
          />
        )}
        
        {activeTab === "analytics" && (
          <AnalyticsView 
            metrics={metrics} 
            onResetMetrics={resetMetrics} 
          />
        )}
        
        {activeTab === "settings" && (
          <SettingsView 
            apiActive={apiActive} 
            nvidiaActive={nvidiaActive}
            onRefreshHealth={checkHealth} 
          />
        )}
      </div>
    </DashboardLayout>
  );
}
