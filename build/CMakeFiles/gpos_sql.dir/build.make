# CMAKE generated file: DO NOT EDIT!
# Generated by "Unix Makefiles" Generator, CMake Version 3.22

# Delete rule output on recipe failure.
.DELETE_ON_ERROR:

#=============================================================================
# Special targets provided by cmake.

# Disable implicit rules so canonical targets will work.
.SUFFIXES:

# Disable VCS-based implicit rules.
% : %,v

# Disable VCS-based implicit rules.
% : RCS/%

# Disable VCS-based implicit rules.
% : RCS/%,v

# Disable VCS-based implicit rules.
% : SCCS/s.%

# Disable VCS-based implicit rules.
% : s.%

.SUFFIXES: .hpux_make_needs_suffix_list

# Command-line flag to silence nested $(MAKE).
$(VERBOSE)MAKESILENT = -s

#Suppress display of executed commands.
$(VERBOSE).SILENT:

# A target that is always out of date.
cmake_force:
.PHONY : cmake_force

#=============================================================================
# Set environment variables for the build.

# The shell in which to execute make rules.
SHELL = /bin/sh

# The CMake executable.
CMAKE_COMMAND = /usr/bin/cmake

# The command to remove a file.
RM = /usr/bin/cmake -E rm -f

# Escaping for special characters.
EQUALS = =

# The top-level source directory on which CMake was run.
CMAKE_SOURCE_DIR = /home/antaresz/GPOS

# The top-level build directory on which CMake was run.
CMAKE_BINARY_DIR = /home/antaresz/GPOS/build

# Include any dependencies generated for this target.
include CMakeFiles/gpos_sql.dir/depend.make
# Include any dependencies generated by the compiler for this target.
include CMakeFiles/gpos_sql.dir/compiler_depend.make

# Include the progress variables for this target.
include CMakeFiles/gpos_sql.dir/progress.make

# Include the compile flags for this target's objects.
include CMakeFiles/gpos_sql.dir/flags.make

CMakeFiles/gpos_sql.dir/gpos_sql.cpp.o: CMakeFiles/gpos_sql.dir/flags.make
CMakeFiles/gpos_sql.dir/gpos_sql.cpp.o: ../gpos_sql.cpp
CMakeFiles/gpos_sql.dir/gpos_sql.cpp.o: CMakeFiles/gpos_sql.dir/compiler_depend.ts
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green --progress-dir=/home/antaresz/GPOS/build/CMakeFiles --progress-num=$(CMAKE_PROGRESS_1) "Building CXX object CMakeFiles/gpos_sql.dir/gpos_sql.cpp.o"
	/usr/bin/c++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -MD -MT CMakeFiles/gpos_sql.dir/gpos_sql.cpp.o -MF CMakeFiles/gpos_sql.dir/gpos_sql.cpp.o.d -o CMakeFiles/gpos_sql.dir/gpos_sql.cpp.o -c /home/antaresz/GPOS/gpos_sql.cpp

CMakeFiles/gpos_sql.dir/gpos_sql.cpp.i: cmake_force
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green "Preprocessing CXX source to CMakeFiles/gpos_sql.dir/gpos_sql.cpp.i"
	/usr/bin/c++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -E /home/antaresz/GPOS/gpos_sql.cpp > CMakeFiles/gpos_sql.dir/gpos_sql.cpp.i

CMakeFiles/gpos_sql.dir/gpos_sql.cpp.s: cmake_force
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green "Compiling CXX source to assembly CMakeFiles/gpos_sql.dir/gpos_sql.cpp.s"
	/usr/bin/c++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -S /home/antaresz/GPOS/gpos_sql.cpp -o CMakeFiles/gpos_sql.dir/gpos_sql.cpp.s

# Object files for target gpos_sql
gpos_sql_OBJECTS = \
"CMakeFiles/gpos_sql.dir/gpos_sql.cpp.o"

# External object files for target gpos_sql
gpos_sql_EXTERNAL_OBJECTS =

gpos_sql: CMakeFiles/gpos_sql.dir/gpos_sql.cpp.o
gpos_sql: CMakeFiles/gpos_sql.dir/build.make
gpos_sql: CMakeFiles/gpos_sql.dir/link.txt
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green --bold --progress-dir=/home/antaresz/GPOS/build/CMakeFiles --progress-num=$(CMAKE_PROGRESS_2) "Linking CXX executable gpos_sql"
	$(CMAKE_COMMAND) -E cmake_link_script CMakeFiles/gpos_sql.dir/link.txt --verbose=$(VERBOSE)

# Rule to build all files generated by this target.
CMakeFiles/gpos_sql.dir/build: gpos_sql
.PHONY : CMakeFiles/gpos_sql.dir/build

CMakeFiles/gpos_sql.dir/clean:
	$(CMAKE_COMMAND) -P CMakeFiles/gpos_sql.dir/cmake_clean.cmake
.PHONY : CMakeFiles/gpos_sql.dir/clean

CMakeFiles/gpos_sql.dir/depend:
	cd /home/antaresz/GPOS/build && $(CMAKE_COMMAND) -E cmake_depends "Unix Makefiles" /home/antaresz/GPOS /home/antaresz/GPOS /home/antaresz/GPOS/build /home/antaresz/GPOS/build /home/antaresz/GPOS/build/CMakeFiles/gpos_sql.dir/DependInfo.cmake --color=$(COLOR)
.PHONY : CMakeFiles/gpos_sql.dir/depend

