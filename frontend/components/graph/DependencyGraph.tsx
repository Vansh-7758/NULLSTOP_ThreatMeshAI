// frontend/components/graph/DependencyGraph.tsx
'use client';

import React, { useMemo, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  NodeMouseHandler
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Package, AttackPath } from '@/types';
import PackageNode from '@/components/graph/PackageNode';

interface DependencyGraphProps {
  packages?: Package[];
  attackPaths?: AttackPath[];
  selectedPackageId?: string | null;
  onPackageSelect?: (pkg: Package) => void;
  loading?: boolean;
}

const nodeTypes = {
  packageNode: PackageNode
};

export default function DependencyGraph({
  packages = [],
  attackPaths = [],
  selectedPackageId = null,
  onPackageSelect,
  loading = false
}: DependencyGraphProps) {
  // Compute hierarchical layout:
  // Root node (or first package) at (0, 0)
  // Direct dependencies at y = 160
  // Transitive dependencies at y = 320, 480...
  const { initialNodes, initialEdges } = useMemo(() => {
    if (!packages || packages.length === 0) {
      return { initialNodes: [], initialEdges: [] };
    }

    const attackPathEdgeSet = new Set<string>();
    const attackPathNodeSet = new Set<string>();

    attackPaths.forEach((ap) => {
      if (Array.isArray(ap.path) && ap.path.length > 1) {
        for (let i = 0; i < ap.path.length - 1; i++) {
          const u = ap.path[i].split('@')[0];
          const v = ap.path[i + 1].split('@')[0];
          attackPathEdgeSet.add(`${u}->${v}`);
          attackPathNodeSet.add(u);
          attackPathNodeSet.add(v);
        }
      }
    });

    const rootPkg = packages[0];
    const rootName = rootPkg.name;

    // Build adjoin list
    const parentsOf = new Map<string, string[]>();
    packages.forEach((pkg) => {
      if (Array.isArray(pkg.dependencies)) {
        pkg.dependencies.forEach((depRef) => {
          const childName = depRef.split('@')[0];
          const current = parentsOf.get(childName) || [];
          current.push(pkg.name);
          parentsOf.set(childName, current);
        });
      }
    });

    // Determine depth for each package using BFS from root
    const depthMap = new Map<string, number>();
    depthMap.set(rootName, 0);

    const queue: string[] = [rootName];
    while (queue.length > 0) {
      const curr = queue.shift()!;
      const currDepth = depthMap.get(curr) || 0;

      const pkgObj = packages.find((p) => p.name === curr);
      if (pkgObj && Array.isArray(pkgObj.dependencies)) {
        pkgObj.dependencies.forEach((depRef) => {
          const childName = depRef.split('@')[0];
          if (!depthMap.has(childName)) {
            depthMap.set(childName, currDepth + 1);
            queue.push(childName);
          }
        });
      }
    }

    // Group packages by depth
    const layers = new Map<number, Package[]>();
    packages.forEach((pkg) => {
      const d = depthMap.has(pkg.name) ? depthMap.get(pkg.name)! : 1;
      const currentLayer = layers.get(d) || [];
      currentLayer.push(pkg);
      layers.set(d, currentLayer);
    });

    // Compute positions
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    layers.forEach((layerPkgs, depth) => {
      const y = depth * 160;
      const totalInLayer = layerPkgs.length;
      const spacingX = 220;
      const startX = -((totalInLayer - 1) * spacingX) / 2;

      layerPkgs.forEach((pkg, index) => {
        const x = startX + index * spacingX;

        nodes.push({
          id: pkg.name,
          type: 'packageNode',
          position: { x, y },
          data: {
            label: pkg.name,
            package: pkg,
            trustScore: pkg.trust_score,
            hasAttackPath: attackPathNodeSet.has(pkg.name)
          },
          selected: selectedPackageId === pkg.name
        });
      });
    });

    // Build edges
    packages.forEach((pkg) => {
      if (Array.isArray(pkg.dependencies)) {
        pkg.dependencies.forEach((depRef) => {
          const childName = depRef.split('@')[0];
          const edgeKey = `${pkg.name}->${childName}`;
          const isAttackEdge = attackPathEdgeSet.has(edgeKey);

          edges.push({
            id: `edge-${edgeKey}`,
            source: pkg.name,
            target: childName,
            animated: isAttackEdge,
            style: isAttackEdge
              ? { stroke: '#E84040', strokeWidth: 3 }
              : { stroke: '#30363D', strokeWidth: 1.5, opacity: 0.5 }
          });
        });
      }
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [packages, attackPaths, selectedPackageId]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync state when props change
  React.useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      const clickedPkg = node.data?.package as Package;
      if (clickedPkg && onPackageSelect) {
        onPackageSelect(clickedPkg);
      }
    },
    [onPackageSelect]
  );

  const getMiniMapNodeColor = useCallback((node: Node) => {
    const score = node.data?.trustScore ?? node.data?.package?.trust_score ?? 100;
    if (score < 50) return '#E84040';
    if (score < 80) return '#F0A500';
    return '#00C896';
  }, []);

  if (loading) {
    return (
      <div className="w-full h-full min-h-[450px] bg-[#0D1117] border border-[#30363D] rounded-xl flex items-center justify-center animate-pulse">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-[#00C896] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-[#8B949E]">Building Interactive Knowledge Graph...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[450px] bg-[#0D1117] border border-[#30363D] rounded-xl overflow-hidden relative shadow-inner">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2}
      >
        <Background color="#30363D" gap={20} size={1} />
        <Controls className="!bg-[#161B22] !border-[#30363D] !fill-[#E6EDF3] !rounded-lg" />
        <MiniMap
          nodeColor={getMiniMapNodeColor}
          className="!bg-[#161B22] !border-[#30363D] !rounded-lg"
          maskColor="rgba(13, 17, 23, 0.7)"
        />
      </ReactFlow>
    </div>
  );
}
