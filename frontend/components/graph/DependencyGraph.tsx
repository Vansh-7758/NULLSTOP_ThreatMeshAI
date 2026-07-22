'use client';
import { useMemo, useCallback } from 'react';
import ReactFlow, { Background, Controls, MiniMap, Edge, Node } from 'reactflow';
import 'reactflow/dist/style.css';
import { Package, AttackPath } from '@/types';
import PackageNode from './PackageNode';

const nodeTypes = { packageNode: PackageNode };

interface DependencyGraphProps {
  packages: Package[];
  attackPaths: AttackPath[];
  onNodeClick: (pkg: Package) => void;
}

export default function DependencyGraph({ packages, attackPaths, onNodeClick }: DependencyGraphProps) {
  const { nodes, edges } = useMemo(() => {
    const nodesMap = new Map<string, Node>();
    const radius = Math.max(300, packages.length * 10);
    const angleStep = (2 * Math.PI) / (packages.length || 1);
    
    packages.forEach((pkg, index) => {
      const angle = index * angleStep;
      const x = 500 + radius * Math.cos(angle);
      const y = 500 + radius * Math.sin(angle);
      
      let trustScore = pkg.trust_score || 0;
      let dependentCount = packages.filter(p => p.dependencies.includes(pkg.id)).length;
      
      nodesMap.set(pkg.id, {
        id: pkg.id,
        type: 'packageNode',
        position: { x, y },
        data: {
          label: pkg.name,
          package: pkg,
          trustScore: { score: trustScore },
          dependentCount
        }
      });
    });

    const edgesList: Edge[] = [];
    packages.forEach(pkg => {
      pkg.dependencies.forEach(dep => {
        if (nodesMap.has(dep)) {
          edgesList.push({
            id: `${pkg.id}-${dep}`,
            source: pkg.id,
            target: dep,
            style: { stroke: '#30363D' },
          });
        }
      });
    });

    attackPaths.forEach(path => {
      for (let i = 0; i < path.path.length - 1; i++) {
        const source = path.path[i];
        const target = path.path[i+1];
        const existingEdge = edgesList.find(e => e.source === source && e.target === target);
        if (existingEdge) {
          existingEdge.animated = true;
          existingEdge.style = { stroke: '#E84040', strokeWidth: 3 };
        } else {
          edgesList.push({
            id: `attack-${source}-${target}`,
            source,
            target,
            animated: true,
            style: { stroke: '#E84040', strokeWidth: 3 },
          });
        }
      }
    });

    return { nodes: Array.from(nodesMap.values()), edges: edgesList };
  }, [packages, attackPaths]);

  const onNodeClickCallback = useCallback((event: React.MouseEvent, node: Node) => {
    onNodeClick(node.data.package);
  }, [onNodeClick]);

  return (
    <div className="w-full h-[600px] bg-[#0D1117] rounded-lg border border-[#30363D] overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClickCallback}
        fitView
      >
        <Background color="#30363D" gap={16} />
        <Controls className="bg-[#161B22] text-[#E6EDF3] border-[#30363D]" />
        <MiniMap 
          nodeColor={(n) => {
            const score = n.data.trustScore?.score || 0;
            if (score >= 80) return '#00C896';
            if (score >= 50) return '#F0A500';
            return '#E84040';
          }}
          className="bg-[#161B22]"
        />
      </ReactFlow>
    </div>
  );
}
