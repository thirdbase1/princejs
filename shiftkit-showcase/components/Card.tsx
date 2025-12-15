// shiftkit-showcase/components/Card.tsx
import React from 'react';

interface CardProps {
  title: string;
  children: React.ReactNode;
}

export const Card = ({ title, children }: CardProps) => {
  return (
    <div className="w-full mx-auto my-8 p-6 border rounded-xl shadow-lg bg-white">
      <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">{title}</h2>
      {children}
    </div>
  );
};
