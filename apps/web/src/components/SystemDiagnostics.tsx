import { useEffect, useState } from 'react';
import { Activity, Cpu, Database, HardDrive, List } from 'lucide-react';

interface Process {
  pid: number;
  name: string;
  memory: string;
  cpu: number;
}

export function SystemDiagnostics() {
  const [cpuUsage, setCpuUsage] = useState(23);
  const [cpuHistory, setCpuHistory] = useState<number[]>(Array(20).fill(23));
  const [cores, setCores] = useState<number[]>(Array(8).fill(0));
  
  const [memoryUsage, setMemoryUsage] = useState(39);
  const [processes, setProcesses] = useState<Process[]>([
    { pid: 1452, name: 'node.js', memory: '450 MB', cpu: 12.5 },
    { pid: 8932, name: 'DevOS_Server.exe', memory: '210 MB', cpu: 4.2 },
    { pid: 104, name: 'systemd', memory: '15 MB', cpu: 0.1 },
    { pid: 3451, name: 'docker', memory: '1.2 GB', cpu: 8.4 },
    { pid: 5678, name: 'vscode', memory: '850 MB', cpu: 5.6 }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate CPU changes
      const newCpu = Math.floor(Math.random() * 40) + 10;
      setCpuUsage(newCpu);
      setCpuHistory(prev => [...prev.slice(1), newCpu]);
      
      setCores(prev => prev.map(() => Math.floor(Math.random() * 100)));
      
      // Simulate memory changes slightly
      setMemoryUsage(prev => {
        const change = Math.floor(Math.random() * 5) - 2;
        return Math.max(10, Math.min(95, prev + change));
      });
      
      // Simulate process changes
      setProcesses(prev => prev.map(p => ({
        ...p,
        cpu: Math.max(0, p.cpu + (Math.random() * 2 - 1)),
      })));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const cardClass = "bg-[#161b22] border border-[rgba(255,255,255,0.06)] rounded-xl p-6 flex flex-col gap-4";

  // Calculate coordinates for CPU history line chart
  const points = cpuHistory.map((val, i) => {
    const x = (i / (cpuHistory.length - 1)) * 100;
    const y = 100 - (val / 100) * 100;
    return `${x},${y}`;
  }).join(' ');

  const memoryRadius = 40;
  const memoryCircumference = 2 * Math.PI * memoryRadius;
  const memoryStrokeDashoffset = memoryCircumference - (memoryUsage / 100) * memoryCircumference;

  return (
    <div className="flex-1 bg-[#0f1117] text-white p-8 overflow-y-auto font-sans">
      <div className="flex items-center gap-3 mb-8">
        <Activity className="text-[#3b82f6]" size={28} />
        <h2 className="text-2xl font-semibold tracking-tight text-white">System Diagnostics</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* CPU Panel */}
        <div className={cardClass}>
          <div className="flex items-center gap-2 text-gray-300">
            <Cpu size={18} />
            <h3 className="font-medium">CPU Usage</h3>
          </div>
          
          <div className="flex items-end justify-between">
            <div className="text-5xl font-light font-mono text-[#3b82f6]">{cpuUsage}%</div>
          </div>
          
          <div className="h-24 w-full bg-[#0f1117] rounded-lg border border-[rgba(255,255,255,0.06)] p-2 relative overflow-hidden">
             <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
               <polyline
                 fill="none"
                 stroke="#3b82f6"
                 strokeWidth="2"
                 points={points}
                 vectorEffect="non-scaling-stroke"
               />
             </svg>
          </div>

          <div className="grid grid-cols-4 gap-4 mt-2">
            {cores.map((core, i) => (
              <div key={i} className="flex flex-col gap-1">
                <div className="flex justify-between text-xs text-gray-400 font-mono">
                  <span>Core {i}</span>
                  <span>{core}%</span>
                </div>
                <div className="h-1.5 w-full bg-[#1e2530] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#3b82f6] transition-all duration-500 ease-in-out" 
                    style={{ width: `${core}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Memory Panel */}
        <div className={cardClass}>
          <div className="flex items-center gap-2 text-gray-300">
            <Database size={18} />
            <h3 className="font-medium">Memory</h3>
          </div>
          
          <div className="flex items-center justify-around flex-1 py-4">
            <div className="relative flex items-center justify-center">
              <svg className="transform -rotate-90 w-32 h-32">
                <circle
                  cx="64"
                  cy="64"
                  r={memoryRadius}
                  stroke="#1e2530"
                  strokeWidth="12"
                  fill="transparent"
                />
                <circle
                  cx="64"
                  cy="64"
                  r={memoryRadius}
                  stroke="#3b82f6"
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray={memoryCircumference}
                  strokeDashoffset={memoryStrokeDashoffset}
                  className="transition-all duration-1000 ease-in-out"
                />
              </svg>
              <div className="absolute text-xl font-mono text-white">
                {memoryUsage}%
              </div>
            </div>

            <div className="flex flex-col gap-4 text-sm">
              <div>
                <div className="text-gray-400 mb-1">Used / Total</div>
                <div className="font-mono text-lg text-white">{(memoryUsage / 100 * 16).toFixed(1)} GB / 16 GB</div>
              </div>
              <div>
                <div className="text-gray-400 mb-1">Available</div>
                <div className="font-mono text-white">{((100 - memoryUsage) / 100 * 16).toFixed(1)} GB</div>
              </div>
              <div>
                <div className="text-gray-400 mb-1">Swap</div>
                <div className="font-mono text-white">1.1 GB</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Disk Usage */}
        <div className={cardClass}>
          <div className="flex items-center gap-2 text-gray-300 mb-2">
            <HardDrive size={18} />
            <h3 className="font-medium">Disk Usage</h3>
          </div>
          
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">C: (Windows/SSD)</span>
                <span className="font-mono text-gray-400">45% Used - 225 GB / 500 GB</span>
              </div>
              <div className="h-2 w-full bg-[#1e2530] rounded-full overflow-hidden">
                <div className="h-full bg-[#3b82f6] w-[45%]" />
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">D: (Data/HDD)</span>
                <span className="font-mono text-gray-400">72% Used - 1.4 TB / 2.0 TB</span>
              </div>
              <div className="h-2 w-full bg-[#1e2530] rounded-full overflow-hidden">
                <div className="h-full bg-[#3b82f6] w-[72%]" />
              </div>
            </div>
          </div>
        </div>

        {/* Active Processes */}
        <div className={cardClass}>
          <div className="flex items-center gap-2 text-gray-300 mb-2">
            <List size={18} />
            <h3 className="font-medium">Active Processes</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-[rgba(255,255,255,0.06)]">
                  <th className="pb-2 font-medium">NAME</th>
                  <th className="pb-2 font-medium">PID</th>
                  <th className="pb-2 font-medium">MEMORY</th>
                  <th className="pb-2 font-medium">CPU</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {processes.map((p) => (
                  <tr key={p.pid} className="border-b border-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.02)]">
                    <td className="py-2.5 text-gray-300">{p.name}</td>
                    <td className="py-2.5 text-gray-500">{p.pid}</td>
                    <td className="py-2.5 text-gray-400">{p.memory}</td>
                    <td className="py-2.5 text-[#3b82f6]">{p.cpu.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
