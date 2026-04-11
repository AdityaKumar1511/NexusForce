'use client';

import React, { useRef, useEffect, useCallback } from 'react';

interface Node {
  id: string;
  type: 'buyer' | 'seller' | 'dispute';
  label: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
}

interface Link {
  source: number;
  target: number;
}

const NODE_COLORS = {
  buyer: '#00E5C3',
  seller: '#6C63FF',
  dispute: '#EF4444',
};

export default function ForceGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const nodesRef = useRef<Node[]>([]);
  const linksRef = useRef<Link[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  const timeRef = useRef(0);

  const initGraph = useCallback((width: number, height: number) => {
    const nodeData = [
      { id: 'b1', type: 'buyer' as const, label: 'DEAL #4821 · $2,400 · ACTIVE' },
      { id: 's1', type: 'seller' as const, label: 'Seller 0x7E2c' },
      { id: 'd1', type: 'dispute' as const, label: 'DISPUTE #1203 · VOTING' },
      { id: 'b2', type: 'buyer' as const, label: 'DEAL #4820 · $890' },
      { id: 's2', type: 'seller' as const, label: 'Seller 0x3F4a' },
      { id: 'b3', type: 'buyer' as const, label: 'DEAL #4819 · $5,500' },
      { id: 's3', type: 'seller' as const, label: 'Seller 0x9B8A' },
      { id: 'b4', type: 'buyer' as const, label: 'DEAL #4817 · $1,200' },
      { id: 's4', type: 'seller' as const, label: 'Seller 0xABCD' },
      { id: 'd2', type: 'dispute' as const, label: 'DISPUTE #1199 · RESOLVED' },
      { id: 'b5', type: 'buyer' as const, label: 'DEAL #4816 · $3,200' },
      { id: 's5', type: 'seller' as const, label: 'Seller 0xEF56' },
      { id: 'b6', type: 'buyer' as const, label: 'DEAL #4815 · $800' },
      { id: 's6', type: 'seller' as const, label: 'Seller 0x1234' },
      { id: 'b7', type: 'buyer' as const, label: 'DEAL #4814 · $1,500' },
      { id: 's7', type: 'seller' as const, label: 'Seller 0x5678' },
      { id: 'b8', type: 'buyer' as const, label: 'DEAL #4813 · $4,200' },
      { id: 's8', type: 'seller' as const, label: 'Seller 0x9ABC' },
      { id: 'b9', type: 'buyer' as const, label: 'DEAL #4812 · $680' },
      { id: 's9', type: 'seller' as const, label: 'Seller 0xDEF0' },
      { id: 'b10', type: 'buyer' as const, label: 'DEAL #4811 · $2,100' },
      { id: 's10', type: 'seller' as const, label: 'Seller 0x2468' },
    ];

    const linkData = [
      { source: 0, target: 1 }, { source: 0, target: 2 },
      { source: 1, target: 2 }, { source: 3, target: 4 },
      { source: 5, target: 6 }, { source: 7, target: 8 },
      { source: 9, target: 12 }, { source: 10, target: 11 },
      { source: 12, target: 13 }, { source: 14, target: 15 },
      { source: 16, target: 17 }, { source: 18, target: 19 },
      { source: 20, target: 21 }, { source: 3, target: 5 },
      { source: 10, target: 14 },
    ];

    nodesRef.current = nodeData.map((n) => ({
      ...n,
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      targetX: width * 0.2 + Math.random() * width * 0.6,
      targetY: height * 0.2 + Math.random() * height * 0.6,
    }));

    linksRef.current = linkData;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
      initGraph(window.innerWidth, window.innerHeight);
    };

    resize();
    window.addEventListener('resize', resize);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    canvas.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      timeRef.current += 0.01;
      const w = window.innerWidth;
      const h = window.innerHeight;
      
      ctx.clearRect(0, 0, w, h);
      
      const nodes = nodesRef.current;
      const links = linksRef.current;

      // Update node positions with gentle force
      for (const node of nodes) {
        // Drift toward target
        node.vx += (node.targetX - node.x) * 0.0003;
        node.vy += (node.targetY - node.y) * 0.0003;
        
        // Add slight wandering
        node.vx += Math.sin(timeRef.current + parseFloat(node.id.replace(/\D/g, '') || '0')) * 0.01;
        node.vy += Math.cos(timeRef.current * 1.3 + parseFloat(node.id.replace(/\D/g, '') || '0')) * 0.01;
        
        // Damping
        node.vx *= 0.99;
        node.vy *= 0.99;
        
        node.x += node.vx;
        node.y += node.vy;
        
        // Bounds
        if (node.x < 50) node.vx += 0.1;
        if (node.x > w - 50) node.vx -= 0.1;
        if (node.y < 50) node.vy += 0.1;
        if (node.y > h - 50) node.vy -= 0.1;
      }

      // Repulsion between nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 120) {
            const force = (120 - dist) * 0.003;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            nodes[i].vx -= fx;
            nodes[i].vy -= fy;
            nodes[j].vx += fx;
            nodes[j].vy += fy;
          }
        }
      }

      // Draw links
      for (const link of links) {
        const source = nodes[link.source];
        const target = nodes[link.target];
        if (!source || !target) continue;

        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Draw nodes & check hover
      let hoveredNode: Node | null = null;
      
      for (const node of nodes) {
        const radius = node.type === 'dispute' ? 8 : 5;
        const color = NODE_COLORS[node.type];
        const breathe = 0.6 + Math.sin(timeRef.current * 2 + node.x * 0.01) * 0.2;
        
        // Check hover
        const dx = mouseRef.current.x - node.x;
        const dy = mouseRef.current.y - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const isHovered = dist < 30;
        
        if (isHovered) hoveredNode = node;

        // Glow
        if (node.type === 'dispute') {
          const pulseSize = 12 + Math.sin(timeRef.current * 3) * 4;
          const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, pulseSize);
          gradient.addColorStop(0, `rgba(255, 71, 87, ${0.3 * breathe})`);
          gradient.addColorStop(1, 'rgba(255, 71, 87, 0)');
          ctx.beginPath();
          ctx.arc(node.x, node.y, pulseSize, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
        }

        // Node circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, isHovered ? radius + 3 : radius, 0, Math.PI * 2);
        ctx.fillStyle = isHovered ? color : `${color}${Math.round(breathe * 200).toString(16).padStart(2, '0')}`;
        ctx.fill();

        // Border
        if (isHovered) {
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // Draw tooltip
      if (hoveredNode) {
        const text = hoveredNode.label;
        ctx.font = '11px IBM Plex Mono';
        const metrics = ctx.measureText(text);
        const padding = 8;
        const tx = hoveredNode.x - metrics.width / 2 - padding;
        const ty = hoveredNode.y - 30;

        ctx.fillStyle = 'rgba(13, 17, 32, 0.9)';
        ctx.beginPath();
        ctx.roundRect(tx, ty - 14, metrics.width + padding * 2, 22, 4);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#E8EDF7';
        ctx.fillText(text, tx + padding, ty);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    // Pause when tab is hidden
    const handleVisibility = () => {
      if (document.hidden) {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
      } else {
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [initGraph]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ zIndex: 0 }}
    />
  );
}
