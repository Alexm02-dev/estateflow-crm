package com.estatecrm.service;

import com.estatecrm.dto.request.BuildingCreateRequest;
import com.estatecrm.dto.request.ProjectCreateRequest;
import com.estatecrm.dto.response.BuildingDto;
import com.estatecrm.dto.response.ProjectDto;
import com.estatecrm.entity.Building;
import com.estatecrm.entity.Project;
import com.estatecrm.exception.BadRequestException;
import com.estatecrm.exception.ConflictException;
import com.estatecrm.exception.ResourceNotFoundException;
import com.estatecrm.repository.BuildingRepository;
import com.estatecrm.repository.ProjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final BuildingRepository buildingRepository;

    public ProjectService(ProjectRepository projectRepository, BuildingRepository buildingRepository) {
        this.projectRepository = projectRepository;
        this.buildingRepository = buildingRepository;
    }

    @Transactional(readOnly = true)
    public List<ProjectDto> getAllProjects() {
        return projectRepository.findAll().stream()
                .map(ProjectDto::new)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProjectDto getProjectById(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with ID: " + id));
        return new ProjectDto(project);
    }

    @Transactional
    public ProjectDto createProject(ProjectCreateRequest request) {
        if (projectRepository.existsByCode(request.getCode().trim().toUpperCase())) {
            throw new ConflictException("Project code '" + request.getCode() + "' is already in use");
        }

        Project project = new Project();
        project.setCode(request.getCode().trim().toUpperCase());
        project.setName(request.getName().trim());
        project.setDescription(request.getDescription());
        project.setAddress(request.getAddress().trim());
        project.setCity(request.getCity().trim());
        project.setStatus(request.getStatus());
        project.setPropertyType(request.getPropertyType());
        project.setStartDate(request.getStartDate());
        project.setCompletionDate(request.getCompletionDate());

        Project saved = projectRepository.save(project);
        return new ProjectDto(saved);
    }

    @Transactional
    public ProjectDto updateProject(Long id, ProjectCreateRequest request) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with ID: " + id));

        project.setName(request.getName().trim());
        project.setDescription(request.getDescription());
        project.setAddress(request.getAddress().trim());
        project.setCity(request.getCity().trim());
        project.setStatus(request.getStatus());
        project.setPropertyType(request.getPropertyType());
        project.setStartDate(request.getStartDate());
        project.setCompletionDate(request.getCompletionDate());

        Project saved = projectRepository.save(project);
        return new ProjectDto(saved);
    }

    @Transactional(readOnly = true)
    public List<BuildingDto> getBuildingsByProject(Long projectId) {
        return buildingRepository.findByProjectId(projectId).stream()
                .map(BuildingDto::new)
                .collect(Collectors.toList());
    }

    @Transactional
    public BuildingDto addBuildingToProject(BuildingCreateRequest request) {
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with ID: " + request.getProjectId()));

        if (buildingRepository.existsByProjectIdAndNameIgnoreCase(request.getProjectId(), request.getName().trim())) {
            throw new ConflictException("Building '" + request.getName() + "' already exists in this project");
        }

        Building building = new Building();
        building.setProject(project);
        building.setName(request.getName().trim());
        building.setFloors(request.getFloors());

        Building saved = buildingRepository.save(building);
        return new BuildingDto(saved);
    }
}
