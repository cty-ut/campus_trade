import React from 'react';
import { Routes, Route } from 'react-router-dom';

import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import MainLayout from '../components/Layout/MainLayout';
import RegisterPage from '../pages/RegisterPage';
import PostDetailPage from '../pages/PostDetailPage';
import CreatePostPage from '../pages/CreatePostPage';
import EditPostPage from '../pages/EditPostPage';
import ProfilePage from '../pages/ProfilePage';
import FavoritesPage from '../pages/FavoritesPage';
import InboxPage from '../pages/InboxPage';
import ConversationPage from '../pages/ConversationPage';
import TransactionsPage from '../pages/TransactionsPage';
import UserProfilePage from '../pages/UserProfilePage';


const AppRouter: React.FC = () => {
  return (
    <Routes>
      
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/posts/new" element={<CreatePostPage />} />
        <Route path="/posts/:id" element={<PostDetailPage />} />
        <Route path="/posts/:id/edit" element={<EditPostPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/users/:userId" element={<UserProfilePage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/inbox" element={<InboxPage />} />
        <Route path="/chat/:postId/:otherUserId" element={<ConversationPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
      </Route>

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

    </Routes>
  );
};

export default AppRouter;