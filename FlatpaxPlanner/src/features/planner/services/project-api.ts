import { apiClient } from '@/services/api/client';

interface CreatedProject {
  id: string;
  projectName: string;
  userId: string;
  regionId: string;
  status: string;
  designCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectResponse {
  id: string;
  projectName: string;
  userId: string;
  regionId: string;
  status: string;
  designCode: string;
  project2DJson: string;
  project3DJson: string;
  projectMetadata: string | null;
  createdAt: string;
  updatedAt: string;
}

function string(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim())
    throw new Error(`Create-project response is missing ${field}.`);
  return value;
}

function parseCreateProjectResponse(value: unknown): CreatedProject {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid create-project response.');

  const project = value as Record<string, unknown>;
  return {
    id: string(project.id, 'id'),
    projectName: string(project.projectName, 'projectName'),
    userId: string(project.userId, 'userId'),
    regionId: string(project.regionId, 'regionId'),
    status: string(project.status, 'status'),
    designCode: string(project.designCode, 'designCode'),
    createdAt: string(project.createdAt, 'createdAt'),
    updatedAt: string(project.updatedAt, 'updatedAt'),
  };
}

function parseProjectResponse(value: unknown): ProjectResponse {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid create-project response.');

  const project = value as Record<string, unknown>;
  return {
    id: string(project.id, 'id'),
    projectName: string(project.projectName, 'projectName'),
    userId: string(project.userId, 'userId'),
    regionId: string(project.regionId, 'regionId'),
    status: string(project.status, 'status'),
    designCode: string(project.designCode, 'designCode'),
    project2DJson: string(project.project2DJson, 'project2DJson'),
    project3DJson: string(JSON.stringify(project.project3DJson), 'project3DJson'),
    projectMetadata: project.projectMetadata != null
      ? string(project.projectMetadata, 'projectMetadata')
      : null,
    createdAt: string(project.createdAt, 'createdAt'),
    updatedAt: string(project.updatedAt, 'updatedAt'),
  };
}

export function createProject(projectName: string): Promise<CreatedProject> {
  return apiClient.request('/Projects', {
    method: 'POST',
    body: {
      projectName,
      project2DJson: {},
      project3DJson: {},
      projectMetadata: 'string',
    },
    parse: parseCreateProjectResponse,
  });
}

const parseUpdateProjectResponse = (): undefined => undefined;

export function updateProject2DJson(projectId: string, project2DJson: string): Promise<void> {
  return apiClient.request(`/Projects/${encodeURIComponent(projectId)}/2d-json`, {
    method: 'PUT',
    body: { project2DJson },
    parse: parseUpdateProjectResponse,
  });
}

export function updateProject3DJson(projectId: string, project3DJson: any): Promise<void> {
  return apiClient.request(`/Projects/${encodeURIComponent(projectId)}/3d-json`, {
    method: 'PUT',
    body: { project3DJson },
    parse: parseUpdateProjectResponse,
  });
}

export function getProjectByDesignCode(designCode: string,): Promise<ProjectResponse> {
  return apiClient.request(`/Projects/${encodeURIComponent(designCode)}`, {
    method: 'GET',
    parse: parseProjectResponse,
  });
}