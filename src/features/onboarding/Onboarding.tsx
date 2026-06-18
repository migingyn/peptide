import { Routes, Route, Navigate } from 'react-router-dom';
import { Splash } from './Splash';
import { Sex } from './Sex';
import { Age } from './Age';
import { Carousel } from './Carousel';
import { MedicalGate } from './MedicalGate';

export function Onboarding() {
  return (
    <Routes>
      <Route index element={<Splash />} />
      <Route path="sex" element={<Sex />} />
      <Route path="age" element={<Age />} />
      <Route path="carousel" element={<Carousel />} />
      <Route path="medical" element={<MedicalGate />} />
      <Route path="*" element={<Navigate to="/onboarding" replace />} />
    </Routes>
  );
}
