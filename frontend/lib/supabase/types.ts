// This file will be auto-generated from Supabase
// Run: npx supabase gen types typescript --project-id <project-id> > lib/supabase/types.ts
// Or manually define types based on the schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type IndustryType = 'restaurant' | 'hotel'
export type LeadStatus = 'new' | 'qualified' | 'contract_review' | 'proposal' | 'closed_won' | 'closed_lost'
export type QualificationStatus = 'unqualified' | 'qualified' | 'disqualified'
export type ContractStatusType = 'single_vendor' | 'multi_vendor' | 'unknown'
export type InteractionType = 'call' | 'email' | 'meeting' | 'ai_call'
export type InteractionDirection = 'inbound' | 'outbound'
export type ContractType = 'single_vendor' | 'multi_vendor'
export type UserRole = 'admin' | 'sdr' | 'manager'

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          industry_type: IndustryType | null
          location_count: number | null
          employee_count: number | null
          revenue_range: string | null
          headquarters_state: string | null
          geographic_distribution: Json
          icp_score: number
          icp_qualified: boolean
          qualification_reason: string | null
          website: string | null
          linkedin_url: string | null
          facebook_url: string | null
          twitter_url: string | null
          address: string | null
          short_description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          industry_type?: IndustryType | null
          location_count?: number | null
          employee_count?: number | null
          revenue_range?: string | null
          headquarters_state?: string | null
          geographic_distribution?: Json
          icp_score?: number
          icp_qualified?: boolean
          qualification_reason?: string | null
          website?: string | null
          linkedin_url?: string | null
          facebook_url?: string | null
          twitter_url?: string | null
          address?: string | null
          short_description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          industry_type?: IndustryType | null
          location_count?: number | null
          employee_count?: number | null
          revenue_range?: string | null
          headquarters_state?: string | null
          geographic_distribution?: Json
          icp_score?: number
          icp_qualified?: boolean
          qualification_reason?: string | null
          website?: string | null
          linkedin_url?: string | null
          facebook_url?: string | null
          twitter_url?: string | null
          address?: string | null
          short_description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      contacts: {
        Row: {
          id: string
          company_id: string | null
          first_name: string | null
          last_name: string | null
          email: string | null
          phone: string | null
          job_title: string | null
          is_decision_maker: boolean
          department: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id?: string | null
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          phone?: string | null
          job_title?: string | null
          is_decision_maker?: boolean
          department?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string | null
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          phone?: string | null
          job_title?: string | null
          is_decision_maker?: boolean
          department?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      leads: {
        Row: {
          id: string
          company_id: string | null
          contact_id: string | null
          source: string
          status: LeadStatus
          stage: string
          icp_score: number
          qualification_status: QualificationStatus
          pain_points: Json
          objections: Json
          contract_status: ContractStatusType
          contract_expiration_date: string | null
          timeline_category: string | null
          estimated_value: number | null
          probability: number
          notes: string | null
          email_verification: boolean | string | null
          name: string | null
          email: string | null
          company_name: string | null
          title: string | null
          lead_tier: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id?: string | null
          contact_id?: string | null
          source?: string
          status?: LeadStatus
          stage?: string
          icp_score?: number
          qualification_status?: QualificationStatus
          pain_points?: Json
          objections?: Json
          contract_status?: ContractStatusType
          contract_expiration_date?: string | null
          timeline_category?: string | null
          estimated_value?: number | null
          probability?: number
          notes?: string | null
          email_verification?: boolean | string | null
          name?: string | null
          email?: string | null
          company_name?: string | null
          title?: string | null
          lead_tier?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string | null
          contact_id?: string | null
          source?: string
          status?: LeadStatus
          stage?: string
          icp_score?: number
          qualification_status?: QualificationStatus
          pain_points?: Json
          objections?: Json
          contract_status?: ContractStatusType
          contract_expiration_date?: string | null
          timeline_category?: string | null
          estimated_value?: number | null
          probability?: number
          notes?: string | null
          email_verification?: boolean | string | null
          name?: string | null
          email?: string | null
          company_name?: string | null
          title?: string | null
          lead_tier?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      interactions: {
        Row: {
          id: string
          lead_id: string | null
          contact_id: string | null
          interaction_type: InteractionType
          direction: InteractionDirection
          subject: string | null
          content: string | null
          duration: number | null
          outcome: string | null
          objections_raised: Json
          qualification_data: Json
          sentiment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          lead_id?: string | null
          contact_id?: string | null
          interaction_type: InteractionType
          direction: InteractionDirection
          subject?: string | null
          content?: string | null
          duration?: number | null
          outcome?: string | null
          objections_raised?: Json
          qualification_data?: Json
          sentiment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          lead_id?: string | null
          contact_id?: string | null
          interaction_type?: InteractionType
          direction?: InteractionDirection
          subject?: string | null
          content?: string | null
          duration?: number | null
          outcome?: string | null
          objections_raised?: Json
          qualification_data?: Json
          sentiment?: string | null
          created_at?: string
        }
      }
      contracts: {
        Row: {
          id: string
          company_id: string | null
          lead_id: string | null
          vendor_name: string
          contract_type: ContractType
          start_date: string | null
          expiration_date: string | null
          monthly_cost: number | null
          locations_covered: number | null
          service_details: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id?: string | null
          lead_id?: string | null
          vendor_name: string
          contract_type: ContractType
          start_date?: string | null
          expiration_date?: string | null
          monthly_cost?: number | null
          locations_covered?: number | null
          service_details?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string | null
          lead_id?: string | null
          vendor_name?: string
          contract_type?: ContractType
          start_date?: string | null
          expiration_date?: string | null
          monthly_cost?: number | null
          locations_covered?: number | null
          service_details?: Json
          created_at?: string
          updated_at?: string
        }
      }
      qualification_responses: {
        Row: {
          id: string
          lead_id: string | null
          question_key: string
          response: string | null
          response_type: string | null
          created_at: string
        }
        Insert: {
          id?: string
          lead_id?: string | null
          question_key: string
          response?: string | null
          response_type?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          lead_id?: string | null
          question_key?: string
          response?: string | null
          response_type?: string | null
          created_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          lead_id: string | null
          assigned_to: string | null
          task_type: string | null
          due_date: string | null
          completed: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          lead_id?: string | null
          assigned_to?: string | null
          task_type?: string | null
          due_date?: string | null
          completed?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          lead_id?: string | null
          assigned_to?: string | null
          task_type?: string | null
          due_date?: string | null
          completed?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          role: UserRole
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          role?: UserRole
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          role?: UserRole
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

