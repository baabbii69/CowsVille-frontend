
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CowService, DataService } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui';
import { ArrowLeft, Activity, Milk, Heart, Calendar, Ruler } from 'lucide-react';

export default function CowDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [tab, setTab] = React.useState('health');

    const { data: cow, isLoading } = useQuery({
        queryKey: ['cow', id],
        queryFn: () => CowService.getOne(id!),
        enabled: !!id
    });

    const { data: breeds } = useQuery({ queryKey: ['breeds'], queryFn: DataService.getBreedTypes });

    if (isLoading) return <div className="p-8 text-center">Loading cow profile...</div>;
    if (!cow) return <div className="p-8 text-center">Cow not found</div>;

    const breedName = breeds?.find(b => b.id === cow.breed)?.name || cow.breed;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate('/cows')}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        {cow.cow_id}
                        <Badge variant={cow.status === 'Sick' ? 'danger' : 'success'}>{cow.status || 'Healthy'}</Badge>
                    </h1>
                    <p className="text-sm text-slate-500">Farm: {typeof cow.farm === 'string' ? cow.farm : (cow.farm as any).farm_id}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Identity Card */}
                <Card>
                    <CardHeader><CardTitle>Identity</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between border-b border-slate-50 pb-2"><span className="text-slate-500">Breed</span> <span className="font-medium">{breedName}</span></div>
                        <div className="flex justify-between border-b border-slate-50 pb-2"><span className="text-slate-500">Sex</span> <span className="font-medium">{cow.sex === 'F' ? 'Female' : 'Male'}</span></div>
                        <div className="flex justify-between border-b border-slate-50 pb-2"><span className="text-slate-500">Date of Birth</span> <span className="font-medium">{cow.date_of_birth || 'N/A'}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Parity</span> <span className="font-medium">{cow.parity}</span></div>
                    </CardContent>
                </Card>

                {/* Production Stats */}
                <Card>
                    <CardHeader><CardTitle>Production</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Milk className="h-6 w-6"/></div>
                            <div>
                                <p className="text-sm text-slate-500">Daily Milk</p>
                                <p className="text-xl font-bold">{cow.average_daily_milk} L</p>
                            </div>
                        </div>
                        <div className="flex justify-between border-t border-slate-100 pt-2 text-sm">
                             <span className="text-slate-500">Lactation #</span>
                             <span className="font-medium">{cow.lactation_number}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                             <span className="text-slate-500">Days in Milk</span>
                             <span className="font-medium">{cow.days_in_milk}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Physical Stats */}
                <Card>
                    <CardHeader><CardTitle>Physical Metrics</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                             <div className="bg-slate-50 p-3 rounded-lg text-center">
                                 <Ruler className="h-5 w-5 mx-auto text-slate-400 mb-1"/>
                                 <p className="text-xs text-slate-500">Weight</p>
                                 <p className="font-bold text-lg">{cow.body_weight} <span className="text-xs font-normal">kg</span></p>
                             </div>
                             <div className="bg-slate-50 p-3 rounded-lg text-center">
                                 <Activity className="h-5 w-5 mx-auto text-slate-400 mb-1"/>
                                 <p className="text-xs text-slate-500">BCS</p>
                                 <p className="font-bold text-lg">{cow.bcs} <span className="text-xs font-normal">/ 5</span></p>
                             </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Tabs */}
            <Card className="min-h-[300px]">
                <CardContent className="p-6">
                    <Tabs>
                        <TabsList className="w-full md:w-auto mb-6">
                            <TabsTrigger active={tab === 'health'} onClick={() => setTab('health')}>Medical History</TabsTrigger>
                            <TabsTrigger active={tab === 'repro'} onClick={() => setTab('repro')}>Reproduction</TabsTrigger>
                        </TabsList>

                        <TabsContent active={tab === 'health'}>
                             <div className="text-center text-slate-500 py-8">No medical assessments recorded yet.</div>
                        </TabsContent>

                        <TabsContent active={tab === 'repro'}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <h3 className="font-semibold flex items-center gap-2"><Heart className="h-4 w-4 text-rose-500"/> Insemination History</h3>
                                    {cow.cow_inseminated_before ? (
                                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm space-y-2">
                                            <div className="flex justify-between"><span className="text-slate-500">Total Inseminations:</span> {cow.number_of_inseminations}</div>
                                            <div className="flex justify-between"><span className="text-slate-500">Last Date:</span> {cow.last_date_insemination || 'N/A'}</div>
                                            <div className="flex justify-between"><span className="text-slate-500">Bull ID Used:</span> {cow.id_or_breed_bull_used || 'N/A'}</div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-500">No insemination records.</p>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    <h3 className="font-semibold flex items-center gap-2"><Calendar className="h-4 w-4 text-blue-500"/> Calving History</h3>
                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm">
                                         <div className="flex justify-between"><span className="text-slate-500">Last Calving:</span> {cow.last_calving_date || 'Never'}</div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
