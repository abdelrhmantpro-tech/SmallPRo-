import React from 'react';
import Layout from '../components/Layout';
import { Card, SectionTitle, Badge } from '../components/UI';
import { useApp } from '../context/AppContext';

export default function AIPage() {
  const { scoped, runAIInsight, runOCRDemo } = useApp();
  return (
    <Layout title="AI Suite" actions={<div className="row gap wrap"><button className="btn primary" onClick={runAIInsight}>Generate insight</button><button className="btn ghost" onClick={runOCRDemo}>Run OCR demo</button></div>}>
      <div className="grid two balanced-grid">
        <Card className="large-card">
          <SectionTitle title="AI insight logs" subtitle="Readable assistant recommendations for sales and operations" />
          <div className="stack">
            {scoped.aiInsights.map((item) => (
              <div key={item.id} className="insight"><div className="row spread"><strong>{item.title}</strong><Badge>{item.confidence}%</Badge></div><small>{item.type}</small><p>{item.text}</p></div>
            ))}
          </div>
        </Card>
        <Card className="large-card">
          <SectionTitle title="OCR extraction results" subtitle="Mock extraction prepared for future backend integration" />
          <div className="stack">
            {scoped.ocrResults.map((item) => (
              <div key={item.id} className="insight"><div className="row spread"><strong>{item.id}</strong><Badge tone={item.status === 'Success' ? 'success' : 'danger'}>{item.status}</Badge></div><small>{item.imagePath}</small><pre>{JSON.stringify(item.extractedData, null, 2)}</pre></div>
            ))}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
