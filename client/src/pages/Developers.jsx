import { useEffect, useState } from "react";
import axios from "axios";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Github, ExternalLink, Star, GitFork, Linkedin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const DEVELOPERS = [
  "Abdus-8747",
  "Jainish-2901",
  "chavdamayur01",
];

const LinkedInURL = [
  "https://www.linkedin.com/in/abdus-samad-shamsi/",
  "https://www.linkedin.com/in/jainish-dabgar-87474a320/",
  "https://www.linkedin.com/in/chavda-mayur-115594305/",
]

const REPO = {
  owner: "CodeBuilders-BCA",
  name: "codebuilders",
};

const Developers = () => {
  const [devs, setDevs] = useState([]);
  const [repo, setRepo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const devRequests = DEVELOPERS.map(username =>
          axios.get(`https://api.github.com/users/${username}`)
        );

        const repoRequest = axios.get(
          `https://api.github.com/repos/${REPO.owner}/${REPO.name}`
        );

        const devResponses = await Promise.all(devRequests);
        const repoResponse = await repoRequest;

        setDevs(devResponses.map(res => res.data));
        setRepo(repoResponse.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">

          {/* Hero */}
          <div className="text-center mb-20">
            <span className="text-primary font-mono text-sm uppercase tracking-wider">
              // The Developers
            </span>
            <h1 className="text-4xl md:text-6xl font-bold mt-4 mb-6">
              Builders Of <span className="text-primary">Code Builders</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              The people who make this project possible through their dedication and expertise.
            </p>
          </div>

          {/* Developers Grid */}
          <section className="mb-20">
          

            <div className="grid md:grid-cols-3 gap-8">
              {loading
                ? [...Array(3)].map((_, i) => (
                    <div key={i} className="glass rounded-2xl p-6">
                      <Skeleton className="w-32 h-32 rounded-full mx-auto mb-6" />
                      <Skeleton className="h-5 w-3/4 mx-auto mb-2" />
                      <Skeleton className="h-4 w-1/2 mx-auto" />
                    </div>
                  ))
                : devs.map(dev => (
                    <div
                      key={dev.id}
                      className="glass rounded-2xl p-6 text-center hover:border-primary/50 transition-all duration-300"
                    >
                      <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary to-cyan-400 p-[2px]">
                        <img
                          src={dev.avatar_url}
                          alt={dev.login}
                          className="w-full h-full object-cover rounded-full"
                        />
                      </div>

                      <h3 className="text-lg font-bold mb-1">
                        {dev.name || dev.login}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-2">
                        @{dev.login}
                      </p>

                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                        {dev.bio || "Code. Coffee. Commits."}
                      </p>

                      <div className="flex justify-center gap-6 text-sm text-muted-foreground mb-4">
                        <span>Repos: {dev.public_repos}</span>
                        <span>Followers: {dev.followers}</span>
                      </div>

                      <a
                        href={dev.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition"
                      >
                        <Github className="w-4 h-4 hover:opacity-80" />
                        GitHub
                      </a>
                      <a
                        href={LinkedInURL[DEVELOPERS.indexOf(dev.login)]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition ml-2"
                      >
                        <Linkedin className="w-4 h-4 hover:opacity-80" />
                        Linked In
                      </a>
                    </div>
                  ))}
            </div>
          </section>

          {/* Open Source Repo */}
          {repo && (
            <section className="glass rounded-2xl p-8 max-w-4xl mx-auto">
              <div className="text-center mb-6">
                <span className="text-primary font-mono text-sm uppercase">
                  // Open Source
                </span>
                <h2 className="text-3xl font-bold mt-4">
                  CodeBuilders Events Repository
                </h2>
              </div>

              <p className="text-muted-foreground text-center mb-6">
                The source code that powers CodeBuilders events, tickets, and community tools.
              </p>

              <div className="flex flex-wrap justify-center gap-6 text-muted-foreground mb-8">
                <span className="flex items-center gap-2">
                  <Star className="w-4 h-4" /> {repo.stargazers_count} Stars
                </span>
                <span className="flex items-center gap-2">
                  <GitFork className="w-4 h-4" /> {repo.forks_count} Forks
                </span>
                <span className="flex items-center gap-2">
                  <Github className="w-4 h-4" /> {repo.language}
                </span>
              </div>

              <div className="text-center">
                <a
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition"
                >
                  View Source Code
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Developers;
