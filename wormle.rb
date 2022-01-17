#!/usr/loca/env ruby

require 'pp'

# test with https://swag.github.io/evil-wordle/

words_output = File.read('wordle_official_wordlist.txt')
words_list = words_output.split("\n")

# words_list = words_list
#   .select { |word| word.size == 5 }
#   .select { |word| word.chars.first != word.chars.first.upcase }

loop do
  puts 'would you like me to choose the word for you?'
  answer = gets.chomp

  if answer == 'yes'
    choosen_word = words_list.sample
  else
    puts 'tell me your word:'
    choosen_word = gets.chomp
  end

  puts "the chosen word is #{choosen_word}"
  puts 'what color series did you get? [B]lack/[G]reen/[Y]ello/ignore'
  answer_input = gets.chomp

  if answer_input == 'ignore'
    next
  end

  answer_sequence = answer_input.split('')

  if answer_input == 'ggggg'
    puts "the word was #{choosen_word}!!!"
    break
  end

  allowed_chars = []

  # first scan to store the green and yellow characters
  answer_sequence.each_with_index do |box, i|
    if box == 'g' || box == 'y'
      allowed_chars.push(choosen_word[i])
    end
  end

  # second scan deletes all the words by filtering the colors sequence
  answer_sequence.each_with_index do |box, i|
    temp_char = choosen_word[i]
    words_to_delete = []

    if box == 'g'
      puts "keep the #{temp_char} in position #{i}"

      words_list.each do |temp_word|
        if temp_word[i] != temp_char
          words_to_delete.push(temp_word)
        end
      end
    elsif box == 'y'
      puts "ignore #{temp_char} from position #{i}"

      words_list.each do |temp_word|
        if !temp_word.include? temp_char
          words_to_delete.push(temp_word)
        end

        if temp_word[i] == temp_char
          words_to_delete.push(temp_word)
        end
      end
    elsif box == 'b'
      puts "delete all words with #{temp_char}"

      words_list.each do |temp_word|
        if (temp_word.include? temp_char) && (!allowed_chars.include? temp_char)
          words_to_delete.push(temp_word)
        end
      end
    end

    words_list = words_list.filter { |word| !words_to_delete.include? word }
  end

  pp words_list

  if words_list.empty?
    puts 'finished all the words :('
    break
  end
end
