import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Badge } from './ui/badge';
import { Plus, Clock, FileText, Activity, Eye, Edit } from 'lucide-react';

interface DashboardHomeProps {
  onStartConsultation: () => void;
  onViewConsultation: () => void;
  onEditNotes: () => void;
  onViewAllHistory: () => void;
}

export function DashboardHome({ onStartConsultation, onViewConsultation, onEditNotes, onViewAllHistory }: DashboardHomeProps) {
  const stats = [
    {
      label: "Today's Consultations",
      value: '12',
      icon: Activity,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Avg Time Saved',
      value: '18 min',
      icon: Clock,
      color: 'bg-green-50 text-green-600',
    },
    {
      label: 'Total Prescriptions',
      value: '247',
      icon: FileText,
      color: 'bg-purple-50 text-purple-600',
    },
  ];

  const recentConsultations = [
    {
      id: 1,
      patient: 'Sarah Williams',
      date: 'Nov 2, 2025 - 10:30 AM',
      status: 'Completed',
      statusColor: 'bg-green-100 text-green-700',
    },
    {
      id: 2,
      patient: 'Michael Chen',
      date: 'Nov 2, 2025 - 09:15 AM',
      status: 'Completed',
      statusColor: 'bg-green-100 text-green-700',
    },
    {
      id: 3,
      patient: 'Emily Rodriguez',
      date: 'Nov 1, 2025 - 04:45 PM',
      status: 'Draft',
      statusColor: 'bg-yellow-100 text-yellow-700',
    },
    {
      id: 4,
      patient: 'James Anderson',
      date: 'Nov 1, 2025 - 02:20 PM',
      status: 'Completed',
      statusColor: 'bg-green-100 text-green-700',
    },
    {
      id: 5,
      patient: 'Lisa Thompson',
      date: 'Nov 1, 2025 - 11:00 AM',
      status: 'Completed',
      statusColor: 'bg-green-100 text-green-700',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-4xl">Welcome Dr. Ahmed</h1>
          <p className="text-gray-500 mt-1">Here's your practice overview for today</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Button
            onClick={onStartConsultation}
            className="h-12 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 transition-all hover:shadow-lg hover:-translate-y-1 active:scale-97"
          >
            <Plus className="w-5 h-5 mr-2" />
            Start New Consultation
          </Button>
        </motion.div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <Card className="p-6 rounded-3xl border-gray-100 hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer backdrop-blur-sm bg-white/80">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-gray-500">{stat.label}</p>
                  <p className="text-4xl">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-2xl ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Consultations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card className="p-6 rounded-3xl border-gray-100 backdrop-blur-sm bg-white/80">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl">Recent Consultations</h2>
            <Button
              variant="ghost"
              onClick={onViewAllHistory}
              className="rounded-xl hover:bg-gray-50 hover:-translate-y-0.5 active:scale-97 transition-all"
            >
              View All History
            </Button>
          </div>

          <div className="rounded-2xl border border-gray-100 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead>Patient Name</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentConsultations.map((consultation, index) => (
                  <motion.tr
                    key={consultation.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 + index * 0.05 }}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    <TableCell>{consultation.patient}</TableCell>
                    <TableCell className="text-gray-500">{consultation.date}</TableCell>
                    <TableCell>
                      <Badge
                        className={`${consultation.statusColor} rounded-lg border-0`}
                      >
                        {consultation.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={onViewConsultation}
                          className="rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all hover:-translate-y-0.5 active:scale-97"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={onEditNotes}
                          className="rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all hover:-translate-y-0.5 active:scale-97"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit Notes
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
