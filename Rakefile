require 'rake/testtask'

Rake::TestTask.new(:test) do |t|
  t.libs << "test"
  t.libs << "."
  t.test_files = FileList['test/test_*.rb']
  t.verbose = true
end

task :default => :test

# Individual test tasks
desc "Run singles match serialization tests"
task :test_singles do
  ruby 'test/test_serialize_open_match_singles.rb'
end

desc "Run doubles match serialization tests"
task :test_doubles do
  ruby 'test/test_serialize_open_match_doubles.rb'
end

desc "Run best-of-3 match serialization tests"
task :test_best_of do
  ruby 'test/test_serialize_open_match_best_of.rb'
end
