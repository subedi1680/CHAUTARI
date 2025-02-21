import 'bootstrap/dist/css/bootstrap.min.css';
import { useState } from 'react';

function HomePage() {
  const [activeTab, setActiveTab] = useState('posts');

  const posts = [
    {
      id: 1,
      user: 'Jane Doe',
      title: 'What is the best programming language for web development?',
      content: 'I am new to web development. Can anyone suggest the best programming language to start with?',
      upvotes: 20,
      comments: 5,
    },
    {
      id: 2,
      user: 'John Smith',
      title: 'How do you stay motivated to learn coding?',
      content: 'Sometimes I get discouraged. Any tips to stay motivated while learning programming?',
      upvotes: 35,
      comments: 12,
    },
  ];

  return (
    <div className="d-flex vh-100">
      {/* Sidebar */}
      <div className="p-3 border-end bg-light" style={{ width: '250px' }}>
        <h5 className="fw-bold">Home Page</h5>
        <ul className="nav flex-column">
          <li className="nav-item">
            <a 
              href="#"
              className={`nav-link ${activeTab === 'posts' ? 'active' : ''}`}
              onClick={() => setActiveTab('posts')}
            >
              Posts Feed
            </a>
          </li>
          <li className="nav-item">
            <a 
              href="#"
              className={`nav-link ${activeTab === 'questions' ? 'active' : ''}`}
              onClick={() => setActiveTab('questions')}
            >
              Questions
            </a>
          </li>
          <li className="nav-item">
            <a 
              href="#"
              className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              Profile
            </a>
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="flex-grow-1 p-4">
        {activeTab === 'posts' && (
          <>
            <h4>Posts Feed</h4>
            <div className="card p-4 shadow-sm" style={{ maxWidth: '800px' }}>
              {posts.map((post) => (
                <div className="mb-4" key={post.id}>
                  <div className="d-flex justify-content-between">
                    <h5>{post.title}</h5>
                    <div className="d-flex align-items-center">
                      <span className="me-2">Upvotes: {post.upvotes}</span>
                      <button className="btn btn-outline-primary btn-sm">Upvote</button>
                    </div>
                  </div>
                  <p className="text-muted">by {post.user}</p>
                  <p>{post.content}</p>
                  <div className="d-flex justify-content-between">
                    <button className="btn btn-outline-secondary btn-sm">Comments ({post.comments})</button>
                    <button className="btn btn-outline-primary btn-sm">Share</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'questions' && (
          <>
            <h4>Questions</h4>
            <div className="card p-4 shadow-sm" style={{ maxWidth: '800px' }}>
              <div className="mb-4">
                <h5>How to get started with JavaScript?</h5>
                <p className="text-muted">by Alice</p>
                <p>Can someone help me with the basic steps to start learning JavaScript for front-end web development?</p>
                <div className="d-flex justify-content-between">
                  <button className="btn btn-outline-secondary btn-sm">Answer</button>
                  <button className="btn btn-outline-primary btn-sm">Upvote</button>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'profile' && (
          <>
            <h4>Your Profile</h4>
            <div className="card p-4 shadow-sm" style={{ maxWidth: '800px' }}>
              <h5>Jane Doe</h5>
              <p>Email: janedoe@example.com</p>
              <p>Bio: Web developer, passionate about coding and learning new technologies.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default HomePage;
