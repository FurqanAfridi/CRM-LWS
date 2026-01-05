'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Building2, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function NewCompanyPage() {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        website: '',
        industry_type: '',
        address: '',
        linkedin_url: '',
        facebook_url: '',
        twitter_url: '',
        short_description: '',
        employee_count: '',
        revenue_range: '',
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.name) {
            toast.error('Company name is required')
            return
        }

        setIsSubmitting(true)

        try {
            const response = await fetch('/api/companies', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    employee_count: formData.employee_count ? parseInt(formData.employee_count) : null,
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to create company')
            }

            const data = await response.json()

            toast.success('Company created successfully!', {
                description: `${formData.name} has been added to your CRM`
            })

            // Redirect to companies page
            router.push('/dashboard/companies')
        } catch (error) {
            console.error('Error creating company:', error)
            toast.error('Failed to create company. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/companies">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-4xl font-bold text-[#004565] flex items-center gap-2">
                        <Building2 className="h-8 w-8" />
                        New Company
                    </h1>
                    <p className="text-[#004565]/70 mt-1">Add a new company to your CRM</p>
                </div>
            </div>

            <Card className="border-[#004565]/20 shadow-lg bg-white/90 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>Company Information</CardTitle>
                    <CardDescription>
                        Enter the details of the company you want to add
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-[#004565]">
                                    Company Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder="e.g., Acme Corporation"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="border-[#004565]/20 focus:border-[#004565]"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="website" className="text-[#004565]">
                                    Website
                                </Label>
                                <Input
                                    id="website"
                                    name="website"
                                    type="url"
                                    placeholder="e.g., https://example.com"
                                    value={formData.website}
                                    onChange={handleChange}
                                    className="border-[#004565]/20 focus:border-[#004565]"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="industry_type" className="text-[#004565]">
                                    Industry
                                </Label>
                                <Input
                                    id="industry_type"
                                    name="industry_type"
                                    placeholder="e.g., Technology, Healthcare"
                                    value={formData.industry_type}
                                    onChange={handleChange}
                                    className="border-[#004565]/20 focus:border-[#004565]"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="employee_count" className="text-[#004565]">
                                    Employee Count
                                </Label>
                                <Input
                                    id="employee_count"
                                    name="employee_count"
                                    type="number"
                                    placeholder="e.g., 100"
                                    value={formData.employee_count}
                                    onChange={handleChange}
                                    className="border-[#004565]/20 focus:border-[#004565]"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="revenue_range" className="text-[#004565]">
                                    Revenue Range
                                </Label>
                                <Input
                                    id="revenue_range"
                                    name="revenue_range"
                                    placeholder="e.g., $1M - $10M"
                                    value={formData.revenue_range}
                                    onChange={handleChange}
                                    className="border-[#004565]/20 focus:border-[#004565]"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address" className="text-[#004565]">
                                    Address
                                </Label>
                                <Input
                                    id="address"
                                    name="address"
                                    placeholder="e.g., 123 Main St, City, State"
                                    value={formData.address}
                                    onChange={handleChange}
                                    className="border-[#004565]/20 focus:border-[#004565]"
                                />
                            </div>
                        </div>

                        {/* Social Media */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-[#004565]">Social Media</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="linkedin_url" className="text-[#004565]">
                                        LinkedIn URL
                                    </Label>
                                    <Input
                                        id="linkedin_url"
                                        name="linkedin_url"
                                        type="url"
                                        placeholder="https://linkedin.com/company/..."
                                        value={formData.linkedin_url}
                                        onChange={handleChange}
                                        className="border-[#004565]/20 focus:border-[#004565]"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="facebook_url" className="text-[#004565]">
                                        Facebook URL
                                    </Label>
                                    <Input
                                        id="facebook_url"
                                        name="facebook_url"
                                        type="url"
                                        placeholder="https://facebook.com/..."
                                        value={formData.facebook_url}
                                        onChange={handleChange}
                                        className="border-[#004565]/20 focus:border-[#004565]"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="twitter_url" className="text-[#004565]">
                                        Twitter URL
                                    </Label>
                                    <Input
                                        id="twitter_url"
                                        name="twitter_url"
                                        type="url"
                                        placeholder="https://twitter.com/..."
                                        value={formData.twitter_url}
                                        onChange={handleChange}
                                        className="border-[#004565]/20 focus:border-[#004565]"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="short_description" className="text-[#004565]">
                                Description
                            </Label>
                            <Textarea
                                id="short_description"
                                name="short_description"
                                placeholder="Brief description of the company..."
                                value={formData.short_description}
                                onChange={handleChange}
                                rows={4}
                                className="border-[#004565]/20 focus:border-[#004565]"
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-4 pt-4 border-t border-[#004565]/10">
                            <Link href="/dashboard/companies">
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={isSubmitting}
                                    className="border-[#004565]/20"
                                >
                                    Cancel
                                </Button>
                            </Link>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-[#004565] hover:bg-[#004565]/90 text-white"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Building2 className="h-4 w-4 mr-2" />
                                        Create Company
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
