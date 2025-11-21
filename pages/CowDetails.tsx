
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CowService, DataService } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Tabs, TabsList, TabsTrigger, TabsContent, Modal } from '../components/ui';
import { ArrowLeft, Activity, Milk, Heart, Calendar, Scale, Clock, Syringe, AlertTriangle, FileText, CheckCircle2, Stethoscope, Info, Home, Zap, Thermometer, TrendingUp } from 'lucide-react';
import { MedicalAssessment, StaffMember } from '../types';
import { useToast } from '../context/ToastContext';

const ViewAssessmentModal = ({ assessment, onClose }: { assessment: MedicalAssessment | null, onClose: () => void }) => {
    if (!assessment) return null;

    return (
        <Modal isOpen={!!assessment} onClose={onClose} title="Medical Assessment Record" className="max-w-xl">
            <div className="space-y-6">
                <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                            Date: {new Date(assessment.assessment_date).toLocaleDateString()}
                        </h3>
                        <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                            Assessed By: <Badge variant="default">{typeof assessment.assessed_by === 'number' ? `Staff ID: ${assessment.assessed_by}` : (assessment.assessed_by as StaffMember).name}</Badge>
                        </p>
                    </div>
                    <Badge variant={assessment.is_cow_sick ? 'danger' : 'success'}>
                        {assessment.is_cow_sick ? 'Sick' : 'Healthy'}
                    </Badge>
                </div>

                <div className="space-y-4 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="block text-slate-500 text-xs uppercase tracking-wider font-bold mb-1">Diagnosis</span>
                            <p className="font-medium text-slate-900 dark:text-white">{assessment.diagnosis || 'None recorded'}</p>
                        </div>
                        <div>
                            <span className="block text-slate-500 text-xs uppercase tracking-wider font-bold mb-1">Sickness Type</span>
                            <p className="font-medium text-slate-900 dark:text-white capitalize">{assessment.sickness_type ? assessment.sickness_type.replace('_', ' ') : 'N/A'}</p>
                        </div>
                    </div>
                    
                    {assessment.is_cow_vaccinated && (
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-blue-800">
                            <div className="flex items-center gap-2 mb-1 font-semibold"><Syringe className="h-4 w-4"/> Vaccination Administered</div>
                            <p className="ml-6">{assessment.vaccination_type} on {assessment.vaccination_date}</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <span className="block text-slate-500 text-xs uppercase tracking-wider font-bold">Treatment & Notes</span>
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                            {assessment.treatment && <p className="mb-2"><strong>Tx:</strong> {assessment.treatment}</p>}
                            {assessment.prescription && <p className="mb-2"><strong>Rx:</strong> {assessment.prescription}</p>}
                            {assessment.notes ? <p>{assessment.notes}</p> : <span className="italic text-slate-400">No additional notes.</span>}
                        </div>
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button onClick={onClose}>Close</Button>
                </div>
            </div>
        </Modal>
    );
}

const LactationCycleVisual = ({ daysInMilk }: { daysInMilk: number }) => {
    const standardLactation = 305;
    const percentage = Math.min((daysInMilk / standardLactation) * 100, 100);
    const isOverdue = daysInMilk > standardLactation;
    
    return (
        <div className="flex items-center gap-4 py-2">
            <div className="relative h-14 w-14 flex items-center justify-center shrink-0">
                <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
                    <path className="text-slate-100 dark:text-slate-800" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3"/>
                    <path 
                        className={isOverdue ? "text-amber-500" : "text-violet-500"} 
                        strokeDasharray={`${percentage}, 100`} 
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="3" 
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute text-[9px] font-bold text-slate-600 dark:text-slate-300 text-center leading-tight">
                    {Math.round(percentage)}%
                </div>
            </div>
            <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Lactation Phase</p>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-1.5 mb-1 overflow-hidden">
                     <div className={`h-full rounded-full ${isOverdue ? 'bg-amber-500' : 'bg-violet-500'}`} style={{ width: `${percentage}%` }}></div>
                </div>
                <p className="text-[10px] text-slate-500">
                    {daysInMilk} days / {standardLactation} target
                    {isOverdue && <span className="text-amber-500 font-medium ml-1">(Late)</span>}
                </p>
            </div>
        </div>
    )
}

const BCSGauge = ({ score }: { score: number }) => {
    // Score is 1-5. 
    // Optimal is typically 2.75 - 3.25 for dairy.
    // < 2.5 Underweight (Red/Amber)
    // > 4 Overweight (Red/Amber)
    
    let colorClass = 'text-emerald-500';
    let label = 'Optimal';
    
    if (score <= 2) { colorClass = 'text-rose-500'; label = 'Very Thin'; }
    else if (score < 2.75) { colorClass = 'text-amber-500'; label = 'Thin'; }
    else if (score > 4) { colorClass = 'text-rose-500'; label = 'Obese'; }
    else if (score > 3.5) { colorClass = 'text-amber-500'; label = 'Fat'; }

    const percentage = (score / 5) * 100;
    
    return (
        <div className="flex flex-col items-center">
            <div className="relative h-24 w-40 overflow-hidden">
                <svg className="h-full w-full" viewBox="0 0 100 55">
                    {/* Background Arc */}
                    <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#e2e8f0" strokeWidth="10" strokeLinecap="round" />
                    
                    {/* Colored Zones (Simplified visual guide) */}
                    {/* Thin Zone */}
                    <path d="M 10 50 A 40 40 0 0 1 35 18" fill="none" stroke="currentColor" strokeWidth="0" className="text-rose-200 opacity-20" />
                    
                    {/* Value Arc */}
                    <path 
                        d="M 10 50 A 40 40 0 0 1 90 50" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="10" 
                        strokeLinecap="round" 
                        className={`${colorClass} transition-all duration-1000`}
                        strokeDasharray={`${(percentage / 100) * 126}, 126`} // Approx arc length
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
                    <span className={`text-3xl font-bold ${colorClass}`}>{score}</span>
                    <span className="text-xs text-slate-400 uppercase font-medium">BCS</span>
                </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 ${colorClass.replace('text-', 'text-opacity-80 ')}`}>
                {label} Condition
            </div>
        </div>
    )
}

const HealthStatusIndicator = ({ label, value }: { label: string, value: string }) => {
    const isGood = ['Good', 'Healthy', 'Negative', 'Normal'].includes(value);
    const isWarning = ['Fair', 'Sub-clinical'].includes(value);
    
    return (
        <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
            <span className="text-sm text-slate-500">{label}</span>
            <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${isGood ? 'text-emerald-600' : isWarning ? 'text-amber-500' : 'text-rose-500'}`}>
                    {value}
                </span>
                <div className={`w-2 h-2 rounded-full ${isGood ? 'bg-emerald-500' : isWarning ? 'bg-amber-500' : 'bg-rose-500'}`}></div>
            </div>
        </div>
    )
}

export default function CowDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('timeline');
    const [selectedRecord, setSelectedRecord] = useState<MedicalAssessment | null>(null);

    const { data: cow, isLoading } = useQuery({
        queryKey: ['cow', id],
        queryFn: () => CowService.getOne(id!),
        enabled: !!id
    });

    const { data: medicalHistory } = useQuery({
        queryKey: ['cow-medical', id],
        queryFn: () => CowService.getMedicalAssessmentsByCow(id!),
        enabled: !!id
    });

    const { data: breeds } = useQuery({ queryKey: ['breeds'], queryFn: DataService.getBreedTypes });
    const { data: gyneStatuses } = useQuery({ queryKey: ['gyne'], queryFn: DataService.getGynecologicalStatuses });

    // Resolve Relations
    const breedName = typeof cow?.breed === 'object' ? (cow.breed as any).name : breeds?.find(b => b.id === cow?.breed)?.name || cow?.breed;
    const gyneStatusName = typeof cow?.gynecological_status === 'object' ? (cow.gynecological_status as any).name : gyneStatuses?.find(g => g.id === cow?.gynecological_status)?.name || 'Unknown';
    
    // Get Latest Health Info
    const latestAssessment = useMemo(() => medicalHistory && medicalHistory.length > 0 ? medicalHistory[0] : null, [medicalHistory]);

    if (isLoading) return <div className="flex h-screen items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div></div>;
    if (!cow) return <div className="p-8 text-center">Cow not found</div>;

    // Mock Age Calculation
    const age = cow.date_of_birth ? 
        Math.floor((new Date().getTime() - new Date(cow.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365.25)) : 'N/A';

    const handleQuickAction = (action: string) => {
        toast({
            type: 'info',
            title: action,
            message: 'This quick action module will be implemented in the next update.',
            duration: 3000
        });
    };

    return (
        <div className="space-y-6 pb-10">
            {/* Vibrant Hero Section - Compact */}
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                
                <div className="relative z-10 px-8 py-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="space-y-1">
                            <Button variant="ghost" size="sm" onClick={() => navigate('/cows')} className="text-slate-300 hover:text-white hover:bg-white/10 -ml-2 h-auto py-1 px-2 text-xs mb-2">
                                <ArrowLeft className="h-3 w-3 mr-1" /> Registry
                            </Button>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold tracking-tight text-white">{cow.cow_id}</h1>
                                <Badge className={`px-2.5 py-0.5 border-0 backdrop-blur-md ${
                                    cow.status === 'Sick' ? 'bg-rose-500/20 text-rose-200' : 
                                    cow.status === 'Pregnant' ? 'bg-amber-500/20 text-amber-200' : 
                                    'bg-emerald-500/20 text-emerald-200'
                                }`}>
                                    {cow.status || 'Active'}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-400">
                                <span className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors" onClick={() => navigate(`/farms/${typeof cow.farm === 'string' ? cow.farm : (cow.farm as any).farm_id}`)}>
                                    <Home className="h-3 w-3" /> {typeof cow.farm === 'string' ? cow.farm : (cow.farm as any).farm_id}
                                </span>
                                <span>•</span>
                                <span>{breedName}</span>
                            </div>
                        </div>
                        
                        <div className="flex gap-3">
                             <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-center">
                                 <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Parity</p>
                                 <p className="text-xl font-bold">{cow.parity}</p>
                             </div>
                             <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-center">
                                 <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Age</p>
                                 <p className="text-xl font-bold">{age} <span className="text-xs font-normal text-slate-500">yrs</span></p>
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column (Sidebar) */}
                <div className="space-y-6">
                    {/* Profile Card */}
                    <Card className="overflow-hidden border-t-4 border-t-violet-500 shadow-md">
                        <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                            <CardTitle className="text-sm uppercase text-slate-500 flex items-center gap-2">
                                <FileText className="h-4 w-4" /> Identity Profile
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="p-5 space-y-4">
                                <div className="flex justify-between text-sm border-b border-slate-100 dark:border-slate-800 pb-3">
                                    <span className="text-slate-500">Tag ID</span>
                                    <span className="font-mono font-bold text-slate-900 dark:text-white">{cow.cow_id}</span>
                                </div>
                                <div className="flex justify-between text-sm border-b border-slate-100 dark:border-slate-800 pb-3">
                                    <span className="text-slate-500">Sex</span>
                                    <span className="font-medium">{cow.sex === 'F' ? 'Female' : 'Male'}</span>
                                </div>
                                <div className="flex justify-between text-sm border-b border-slate-100 dark:border-slate-800 pb-3">
                                    <span className="text-slate-500">DOB</span>
                                    <span className="font-medium">{cow.date_of_birth || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between text-sm border-b border-slate-100 dark:border-slate-800 pb-3">
                                    <span className="text-slate-500">Lactation #</span>
                                    <span className="font-medium">{cow.lactation_number}</span>
                                </div>
                                <div className="flex justify-between text-sm pb-1">
                                    <span className="text-slate-500">Gyn. Status</span>
                                    <span className="font-medium text-violet-600 dark:text-violet-400">{gyneStatusName}</span>
                                </div>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-950/50 px-5 py-4 border-t border-slate-100 dark:border-slate-800">
                                <LactationCycleVisual daysInMilk={cow.days_in_milk} />
                            </div>

                            <div className="p-5 border-t border-slate-100 dark:border-slate-800">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Quick Actions</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button variant="outline" size="sm" className="h-9 text-xs justify-start bg-white dark:bg-slate-900" onClick={() => handleQuickAction('Report Sickness')}>
                                        <Thermometer className="h-3 w-3 mr-2 text-rose-500" /> Report Sick
                                    </Button>
                                    <Button variant="outline" size="sm" className="h-9 text-xs justify-start bg-white dark:bg-slate-900" onClick={() => handleQuickAction('Record Heat')}>
                                        <Zap className="h-3 w-3 mr-2 text-amber-500" /> Record Heat
                                    </Button>
                                    <Button variant="outline" size="sm" className="h-9 text-xs justify-start bg-white dark:bg-slate-900" onClick={() => handleQuickAction('Medical Check')}>
                                        <Stethoscope className="h-3 w-3 mr-2 text-blue-500" /> Med Check
                                    </Button>
                                    <Button variant="outline" size="sm" className="h-9 text-xs justify-start bg-white dark:bg-slate-900" onClick={() => handleQuickAction('Update Production')}>
                                        <Milk className="h-3 w-3 mr-2 text-emerald-500" /> Add Milk
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Health Metrics Card */}
                    <Card className="border-none shadow-lg bg-white dark:bg-slate-900">
                        <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
                            <CardTitle className="text-sm uppercase text-slate-500 flex items-center gap-2">
                                <Activity className="h-4 w-4 text-emerald-500" /> Health Metrics
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="mb-6">
                                <BCSGauge score={cow.bcs} />
                            </div>
                            
                            <div className="space-y-1">
                                <HealthStatusIndicator 
                                    label="General Health" 
                                    value={latestAssessment ? (typeof latestAssessment.general_health === 'object' ? latestAssessment.general_health.name : String(latestAssessment.general_health)) : (cow.status === 'Sick' ? 'Poor' : 'Good')} 
                                />
                                <HealthStatusIndicator 
                                    label="Udder Health" 
                                    value={latestAssessment ? (typeof latestAssessment.udder_health === 'object' ? latestAssessment.udder_health.name : String(latestAssessment.udder_health)) : 'Healthy'} 
                                />
                                <HealthStatusIndicator 
                                    label="Mastitis Status" 
                                    value={latestAssessment ? (typeof latestAssessment.mastitis === 'object' ? latestAssessment.mastitis.name : String(latestAssessment.mastitis)) : 'Negative'} 
                                />
                            </div>
                            
                            {latestAssessment && (
                                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 text-center">
                                    Last assessed: {new Date(latestAssessment.assessment_date).toLocaleDateString()}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column (Main Content) */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Stats Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-300 transition-colors">
                            <CardContent className="p-4 flex flex-col items-center text-center">
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg mb-2">
                                    <Milk className="h-5 w-5" />
                                </div>
                                <p className="text-xs text-slate-500 uppercase font-bold">Daily Yield</p>
                                <p className="text-lg font-bold text-slate-900 dark:text-white">{cow.average_daily_milk} L</p>
                            </CardContent>
                        </Card>
                        <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-300 transition-colors">
                            <CardContent className="p-4 flex flex-col items-center text-center">
                                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg mb-2">
                                    <Scale className="h-5 w-5" />
                                </div>
                                <p className="text-xs text-slate-500 uppercase font-bold">Weight</p>
                                <p className="text-lg font-bold text-slate-900 dark:text-white">{cow.body_weight} kg</p>
                            </CardContent>
                        </Card>
                        <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:border-amber-300 transition-colors">
                            <CardContent className="p-4 flex flex-col items-center text-center">
                                <div className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-lg mb-2">
                                    <Activity className="h-5 w-5" />
                                </div>
                                <p className="text-xs text-slate-500 uppercase font-bold">BCS Score</p>
                                <p className="text-lg font-bold text-slate-900 dark:text-white">{cow.bcs}</p>
                            </CardContent>
                        </Card>
                        <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:border-purple-300 transition-colors">
                            <CardContent className="p-4 flex flex-col items-center text-center">
                                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg mb-2">
                                    <Clock className="h-5 w-5" />
                                </div>
                                <p className="text-xs text-slate-500 uppercase font-bold">Days In Milk</p>
                                <p className="text-lg font-bold text-slate-900 dark:text-white">{cow.days_in_milk}</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Tabs>
                        <div className="border-b border-slate-200 dark:border-slate-800 mb-6">
                            <div className="flex space-x-8">
                                <button
                                    onClick={() => setActiveTab('timeline')}
                                    className={`pb-4 text-sm font-medium transition-all border-b-2 ${activeTab === 'timeline' ? 'border-violet-500 text-violet-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                                >
                                    Medical Timeline
                                </button>
                                <button
                                    onClick={() => setActiveTab('repro')}
                                    className={`pb-4 text-sm font-medium transition-all border-b-2 ${activeTab === 'repro' ? 'border-violet-500 text-violet-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                                >
                                    Reproduction Stats
                                </button>
                            </div>
                        </div>

                        <TabsContent active={activeTab === 'timeline'}>
                            <Card>
                                <CardHeader className="py-4 bg-slate-50/50 dark:bg-slate-900/30">
                                    <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wide text-slate-500">
                                        <FileText className="h-4 w-4" /> Complete History
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    {medicalHistory && medicalHistory.length > 0 ? (
                                        <div className="space-y-8 relative pl-4 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
                                            {medicalHistory.map((record) => (
                                                <div key={record.id} className="relative flex gap-6 group">
                                                    <div className={`relative z-10 h-10 w-10 shrink-0 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-950 shadow-sm ${record.is_cow_sick ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                        {record.is_cow_sick ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                                                    </div>
                                                    <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-100 dark:border-slate-800 hover:border-violet-200 dark:hover:border-violet-900 hover:shadow-md transition-all cursor-pointer" onClick={() => setSelectedRecord(record)}>
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                                                                    {record.diagnosis || (record.is_cow_sick ? 'Sickness Reported' : 'Routine Checkup')}
                                                                </h4>
                                                                <p className="text-xs text-slate-500 mt-0.5">{new Date(record.assessment_date).toLocaleDateString()}</p>
                                                            </div>
                                                            <Badge variant={record.is_cow_sick ? 'danger' : 'success'}>{record.is_cow_sick ? 'Sick' : 'Healthy'}</Badge>
                                                        </div>
                                                        {record.is_cow_vaccinated && (
                                                            <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded w-fit mb-2 border border-blue-100 dark:border-blue-800">
                                                                <Syringe className="h-3 w-3" /> Vaccinated: {record.vaccination_type}
                                                            </div>
                                                        )}
                                                        <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                                                            {record.notes || "No additional notes recorded."}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 text-slate-500">
                                            <div className="bg-slate-50 dark:bg-slate-900 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                                                <Info className="h-8 w-8 opacity-20" />
                                            </div>
                                            No medical records found for this cow.
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent active={activeTab === 'repro'}>
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900">
                                        <CardContent className="p-6">
                                            <div className="flex items-center gap-3 mb-4 text-blue-700 dark:text-blue-300">
                                                <Heart className="h-5 w-5" />
                                                <h3 className="font-bold">Insemination</h3>
                                            </div>
                                            <div className="space-y-3 text-sm">
                                                <div className="flex justify-between border-b border-blue-200/50 pb-2">
                                                    <span className="text-blue-600/70">Total Services</span>
                                                    <span className="font-bold text-blue-900 dark:text-blue-100">{cow.number_of_inseminations}</span>
                                                </div>
                                                <div className="flex justify-between border-b border-blue-200/50 pb-2">
                                                    <span className="text-blue-600/70">Last Date</span>
                                                    <span className="font-bold text-blue-900 dark:text-blue-100">{cow.last_date_insemination || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-blue-600/70">Bull/Semen ID</span>
                                                    <span className="font-bold text-blue-900 dark:text-blue-100">{cow.id_or_breed_bull_used || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="bg-purple-50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900">
                                        <CardContent className="p-6">
                                            <div className="flex items-center gap-3 mb-4 text-purple-700 dark:text-purple-300">
                                                <Calendar className="h-5 w-5" />
                                                <h3 className="font-bold">Calving</h3>
                                            </div>
                                            <div className="space-y-3 text-sm">
                                                <div className="flex justify-between border-b border-purple-200/50 pb-2">
                                                    <span className="text-purple-600/70">Last Calving</span>
                                                    <span className="font-bold text-purple-900 dark:text-purple-100">{cow.last_calving_date || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between border-b border-purple-200/50 pb-2">
                                                    <span className="text-purple-600/70">Total Calves</span>
                                                    <span className="font-bold text-purple-900 dark:text-purple-100">{cow.parity}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-purple-600/70">Ease</span>
                                                    <span className="font-bold text-purple-900 dark:text-purple-100">Normal</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            <ViewAssessmentModal assessment={selectedRecord} onClose={() => setSelectedRecord(null)} />
        </div>
    );
}
