import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Loader2, FileWarning } from 'lucide-react';
import { motion } from 'framer-motion';

const DynamicPage = () => {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPage = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('pages')
          .select('title, content')
          .eq('slug', slug)
          .eq('is_published', true)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            setError('Página não encontrada.');
          } else {
            throw error;
          }
        }
        setPage(data);
      } catch (e) {
        setError('Ocorreu um erro ao carregar a página.');
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-orange-500" />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-6 py-20 text-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                <FileWarning className="h-24 w-24 mx-auto text-red-400 mb-6" />
                <h1 className="text-4xl font-bold text-gray-800 mb-4">Oops! Página não encontrada.</h1>
                <p className="text-xl text-gray-600 mb-8">{error || 'A página que você está procurando não existe ou foi movida.'}</p>
                <Link to="/">
                    <Button size="lg" className="btn-primary text-white">Voltar para a Home</Button>
                </Link>
            </motion.div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <motion.div 
        className="container mx-auto px-6 py-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <article className="prose lg:prose-xl max-w-4xl mx-auto">
          <h1>{page.title}</h1>
          <div dangerouslySetInnerHTML={{ __html: page.content?.body?.replace(/\n/g, '<br />') || '' }} />
        </article>
      </motion.div>
    </div>
  );
};

export default DynamicPage;