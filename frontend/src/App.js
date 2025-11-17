import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE = 'http://localhost:8000';
const PROBLEMS_PER_PAGE = 20;

function App() {
  const [problems, setProblems] = useState([]);
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('generate');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProblems, setTotalProblems] = useState(0);
  
  // Form state for assessment generation
  const [studentId, setStudentId] = useState('student123');
  const [level, setLevel] = useState('intermediate');
  const [maxTime, setMaxTime] = useState(30);
  const [strategy, setStrategy] = useState('REVIEW');
  const [learningGoals, setLearningGoals] = useState('algebra,geometry');
  const [masteredTopics, setMasteredTopics] = useState('basic_arithmetic');

  // Problem CRUD modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view'
  const [selectedProblem, setSelectedProblem] = useState(null);
  
  // Problem form state
  const [problemForm, setProblemForm] = useState({
    id: '',
    text: '',
    topic: '',
    difficulty: 3,
    estimated_time_to_solve_minutes: 5
  });

  // Calculate pagination
  const totalPages = Math.ceil(totalProblems / PROBLEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * PROBLEMS_PER_PAGE;
  const endIndex = startIndex + PROBLEMS_PER_PAGE;
  const currentProblems = problems.slice(startIndex, endIndex);

  // Fetch all problems
  const fetchProblems = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE}/api/problems`);
      setProblems(response.data);
      setTotalProblems(response.data.length);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error fetching problems:', error);
      setError(error.response?.data?.detail || error.message || 'Failed to fetch problems');
    }
    setLoading(false);
  };

  // Create problem
  const createProblem = async () => {
    setLoading(true);
    setError(null);
    try {
      await axios.post(`${API_BASE}/api/problems`, problemForm);
      setSuccessMessage('Problem created successfully!');
      setShowModal(false);
      resetProblemForm();
      fetchProblems();
    } catch (error) {
      console.error('Error creating problem:', error);
      setError(error.response?.data?.detail || error.message || 'Failed to create problem');
    }
    setLoading(false);
  };

  // Update problem
  const updateProblem = async () => {
    setLoading(true);
    setError(null);
    try {
      await axios.put(`${API_BASE}/api/problems/${problemForm.id}`, problemForm);
      setSuccessMessage('Problem updated successfully!');
      setShowModal(false);
      resetProblemForm();
      fetchProblems();
    } catch (error) {
      console.error('Error updating problem:', error);
      setError(error.response?.data?.detail || error.message || 'Failed to update problem');
    }
    setLoading(false);
  };

  // Delete problem
  const deleteProblem = async (problemId) => {
    if (!window.confirm('Are you sure you want to delete this problem?')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      await axios.delete(`${API_BASE}/api/problems/${problemId}`);
      setSuccessMessage('Problem deleted successfully!');
      fetchProblems();
    } catch (error) {
      console.error('Error deleting problem:', error);
      setError(error.response?.data?.detail || error.message || 'Failed to delete problem');
    }
    setLoading(false);
  };

  // Generate assessment
  const generateAssessment = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        student_profile: {
          id: studentId,
          current_level: level,
          learning_history: [],
          learning_goals: learningGoals.split(',').map(g => g.trim()).filter(g => g),
          mastered_topics: masteredTopics.split(',').map(t => t.trim()).filter(t => t)
        },
        assessment_request: {
          max_total_time_minutes: parseInt(maxTime),
          pedagogical_strategy: strategy
        }
      };

      const response = await axios.post(`${API_BASE}/api/assessments/generate`, payload);
      setAssessment(response.data);
      setSuccessMessage('Assessment generated successfully!');
    } catch (error) {
      console.error('Error generating assessment:', error);
      setError(error.response?.data?.detail || error.message || 'Failed to generate assessment');
    }
    setLoading(false);
  };

  // Modal handlers
  const openCreateModal = () => {
    resetProblemForm();
    setModalMode('create');
    setShowModal(true);
  };

  const openEditModal = (problem) => {
    setProblemForm({
      id: problem.id,
      text: problem.text,
      topic: problem.topic,
      difficulty: problem.difficulty,
      estimated_time_to_solve_minutes: problem.estimated_time_to_solve_minutes
    });
    setModalMode('edit');
    setShowModal(true);
  };

  const openViewModal = (problem) => {
    setSelectedProblem(problem);
    setModalMode('view');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetProblemForm();
    setSelectedProblem(null);
  };

  const resetProblemForm = () => {
    setProblemForm({
      id: '',
      text: '',
      topic: '',
      difficulty: 3,
      estimated_time_to_solve_minutes: 5
    });
  };

  const handleProblemFormChange = (field, value) => {
    setProblemForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProblemSubmit = (e) => {
    e.preventDefault();
    if (modalMode === 'create') {
      createProblem();
    } else if (modalMode === 'edit') {
      updateProblem();
    }
  };

  // Pagination handlers
  const goToPage = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  // Auto-dismiss messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (activeTab === 'problems') {
      fetchProblems();
    }
  }, [activeTab]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>🎓 Adaptive Learning Orchestrator</h1>
        <p>AI-Powered Assessment Generation System</p>
      </header>

      <div className="tabs">
        <button 
          className={activeTab === 'generate' ? 'active' : ''}
          onClick={() => setActiveTab('generate')}
        >
          Generate Assessment
        </button>
        <button 
          className={activeTab === 'problems' ? 'active' : ''}
          onClick={() => setActiveTab('problems')}
        >
          Manage Problems
        </button>
      </div>

      <div className="content">
        {error && (
          <div className="error-banner">
            <strong>Error:</strong> {error}
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}

        {successMessage && (
          <div className="success-banner">
            <strong>Success:</strong> {successMessage}
            <button onClick={() => setSuccessMessage(null)}>✕</button>
          </div>
        )}

        {activeTab === 'generate' && (
          <div className="generate-section">
            <h2>Generate New Assessment</h2>
            
            <div className="form">
              <div className="form-group">
                <label>Student ID:</label>
                <input 
                  type="text" 
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="student123"
                />
              </div>

              <div className="form-group">
                <label>Current Level:</label>
                <select value={level} onChange={(e) => setLevel(e.target.value)}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div className="form-group">
                <label>Learning Goals (comma-separated topics):</label>
                <input 
                  type="text" 
                  value={learningGoals}
                  onChange={(e) => setLearningGoals(e.target.value)}
                  placeholder="algebra, geometry, calculus"
                />
                <small>Topics the student wants to focus on</small>
              </div>

              <div className="form-group">
                <label>Mastered Topics (comma-separated):</label>
                <input 
                  type="text" 
                  value={masteredTopics}
                  onChange={(e) => setMasteredTopics(e.target.value)}
                  placeholder="basic_arithmetic, fractions"
                />
                <small>Topics the student has already mastered</small>
              </div>

              <div className="form-group">
                <label>Max Total Time (minutes):</label>
                <input 
                  type="number" 
                  value={maxTime}
                  onChange={(e) => setMaxTime(e.target.value)}
                  min="5"
                  max="120"
                  placeholder="30"
                />
              </div>

              <div className="form-group">
                <label>Pedagogical Strategy:</label>
                <select value={strategy} onChange={(e) => setStrategy(e.target.value)}>
                  <option value="REVIEW">Review</option>
                  <option value="NEW_TOPIC_INTRODUCTION">New Topic Introduction</option>
                  <option value="CHALLENGE">Challenge</option>
                </select>
              </div>

              <button 
                className="generate-btn" 
                onClick={generateAssessment}
                disabled={loading}
              >
                {loading ? 'Generating...' : 'Generate Assessment'}
              </button>
            </div>

            {assessment && (
              <div className="assessment-result">
                <h3>Assessment Generated ✓</h3>
                <div className="result-card">
                  <p><strong>Assessment ID:</strong> {assessment.assessment_id}</p>
                  <p><strong>Generated At:</strong> {new Date(assessment.generated_at).toLocaleString()}</p>
                  
                  <h4>Planner Output:</h4>
                  <div className="planner-output">
                    <p><strong>Plan ID:</strong> {assessment.planner_output.plan_id}</p>
                    <p><strong>Reasoning:</strong> {assessment.planner_output.reasoning_log}</p>
                  </div>

                  <h4>Selected Problems ({assessment.executor_output.problems.length}):</h4>
                  <div className="problems-list">
                    {assessment.executor_output.problems.map((problem, idx) => (
                      <div key={idx} className="problem-card">
                        <h5>Problem {idx + 1}</h5>
                        <p><strong>Question:</strong> {problem.text}</p>
                        <p><strong>Difficulty:</strong> {problem.difficulty}/5</p>
                        <p><strong>Topic:</strong> {problem.topic}</p>
                        <p><strong>Time Estimate:</strong> {problem.estimated_time_to_solve_minutes} min</p>
                      </div>
                    ))}
                  </div>

                  <p className="total-time">
                    <strong>Total Estimated Time:</strong> {assessment.executor_output.total_estimated_time} minutes
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'problems' && (
          <div className="problems-section">
            <div className="problems-header">
              <div>
                <h2>Problem Management</h2>
                <p className="problems-count">
                  Showing {startIndex + 1}-{Math.min(endIndex, totalProblems)} of {totalProblems} problems
                </p>
              </div>
              <button className="create-btn" onClick={openCreateModal}>
                ➕ Create New Problem
              </button>
            </div>
            
            {loading ? (
              <div className="loading-spinner">Loading problems...</div>
            ) : (
              <>
                <div className="problems-grid">
                  {currentProblems.map((problem) => (
                    <div key={problem.id} className="problem-card">
                      <h4>{problem.text}</h4>
                      <div className="problem-meta">
                        <span className={`badge difficulty-${problem.difficulty}`}>
                          Difficulty: {problem.difficulty}/5
                        </span>
                        <span className="badge topic">{problem.topic}</span>
                        <span className="time">{problem.estimated_time_to_solve_minutes} min</span>
                      </div>
                      <div className="problem-actions">
                        <button 
                          className="btn-view" 
                          onClick={() => openViewModal(problem)}
                          title="View Details"
                        >
                          👁️ View
                        </button>
                        <button 
                          className="btn-edit" 
                          onClick={() => openEditModal(problem)}
                          title="Edit Problem"
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          className="btn-delete" 
                          onClick={() => deleteProblem(problem.id)}
                          title="Delete Problem"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="pagination">
                    <button 
                      onClick={goToPrevPage} 
                      disabled={currentPage === 1}
                      className="pagination-btn"
                    >
                      ← Previous
                    </button>

                    <div className="pagination-pages">
                      {[...Array(totalPages)].map((_, index) => {
                        const page = index + 1;
                        if (
                          page === 1 || 
                          page === totalPages || 
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => goToPage(page)}
                              className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                            >
                              {page}
                            </button>
                          );
                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                          return <span key={page} className="pagination-ellipsis">...</span>;
                        }
                        return null;
                      })}
                    </div>

                    <button 
                      onClick={goToNextPage} 
                      disabled={currentPage === totalPages}
                      className="pagination-btn"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Modal for Create/Edit/View Problem */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {modalMode === 'create' && '➕ Create New Problem'}
                {modalMode === 'edit' && '✏️ Edit Problem'}
                {modalMode === 'view' && '👁️ Problem Details'}
              </h2>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>

            {modalMode === 'view' ? (
              <div className="modal-body">
                <div className="view-field">
                  <label>Problem ID:</label>
                  <p>{selectedProblem.id}</p>
                </div>
                <div className="view-field">
                  <label>Question Text:</label>
                  <p>{selectedProblem.text}</p>
                </div>
                <div className="view-field">
                  <label>Topic:</label>
                  <p>{selectedProblem.topic}</p>
                </div>
                <div className="view-field">
                  <label>Difficulty:</label>
                  <p>{selectedProblem.difficulty}/5</p>
                </div>
                <div className="view-field">
                  <label>Estimated Time:</label>
                  <p>{selectedProblem.estimated_time_to_solve_minutes} minutes</p>
                </div>
                <div className="modal-footer">
                  <button className="btn-secondary" onClick={closeModal}>Close</button>
                  <button className="btn-primary" onClick={() => openEditModal(selectedProblem)}>
                    Edit Problem
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleProblemSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Problem ID: *</label>
                    <input
                      type="text"
                      value={problemForm.id}
                      onChange={(e) => handleProblemFormChange('id', e.target.value)}
                      placeholder="e.g., prob_001"
                      required
                      disabled={modalMode === 'edit'}
                    />
                    <small>Unique identifier for the problem</small>
                  </div>

                  <div className="form-group">
                    <label>Question Text: *</label>
                    <textarea
                      value={problemForm.text}
                      onChange={(e) => handleProblemFormChange('text', e.target.value)}
                      placeholder="Enter the problem question..."
                      rows="4"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Topic: *</label>
                    <input
                      type="text"
                      value={problemForm.topic}
                      onChange={(e) => handleProblemFormChange('topic', e.target.value)}
                      placeholder="e.g., algebra, geometry"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Difficulty (1-5): *</label>
                    <input
                      type="number"
                      value={problemForm.difficulty}
                      onChange={(e) => handleProblemFormChange('difficulty', parseInt(e.target.value))}
                      min="1"
                      max="5"
                      required
                    />
                    <small>1 = Very Easy, 5 = Very Hard</small>
                  </div>

                  <div className="form-group">
                    <label>Estimated Time (minutes): *</label>
                    <input
                      type="number"
                      value={problemForm.estimated_time_to_solve_minutes}
                      onChange={(e) => handleProblemFormChange('estimated_time_to_solve_minutes', parseInt(e.target.value))}
                      min="1"
                      max="120"
                      required
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn-secondary" onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : (modalMode === 'create' ? 'Create Problem' : 'Update Problem')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
