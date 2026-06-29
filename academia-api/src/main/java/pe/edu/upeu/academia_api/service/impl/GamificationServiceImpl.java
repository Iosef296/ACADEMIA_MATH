package pe.edu.upeu.academia_api.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.upeu.academia_api.dto.gamification.ChallengeRequest;
import pe.edu.upeu.academia_api.dto.gamification.ChallengeResponse;
import pe.edu.upeu.academia_api.entity.*;
import pe.edu.upeu.academia_api.exception.AppException;
import pe.edu.upeu.academia_api.repository.*;
import pe.edu.upeu.academia_api.service.GamificationService;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.IsoFields;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GamificationServiceImpl implements GamificationService {

    private final BadgeRepository badgeRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final WeeklyChallengeRepository challengeRepository;
    private final WeeklyChallengeAttemptRepository attemptRepository;
    private final RewardRepository rewardRepository;
    private final RankingRepository rankingRepository;
    private final StudentProfileRepository profileRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<Badge> findAllBadges() {
        return badgeRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserBadge> findMyBadges(UUID userId) {
        return userBadgeRepository.findByUserId(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChallengeResponse> findActiveChallenges() {
        LocalDate today = LocalDate.now();
        return challengeRepository.findByStartDateLessThanEqualAndEndDateGreaterThanEqual(today, today)
                .stream().map(this::toChallengeResponse).toList();
    }

    @Override
    @Transactional
    public ChallengeResponse createChallenge(ChallengeRequest request) {
        WeeklyChallenge challenge = WeeklyChallenge.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .rewardXp(request.getRewardXp() != null ? request.getRewardXp() : 100)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .build();
        return toChallengeResponse(challengeRepository.save(challenge));
    }

    @Override
    @Transactional
    public void submitChallenge(UUID challengeId, UUID userId) {
        WeeklyChallenge challenge = challengeRepository.findById(challengeId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Desafío no encontrado"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        WeeklyChallengeAttempt attempt = WeeklyChallengeAttempt.builder()
                .challenge(challenge).user(user)
                .score(challenge.getRewardXp())
                .completedAt(LocalDateTime.now())
                .build();
        attemptRepository.save(attempt);

        profileRepository.findByUserId(userId).ifPresent(p -> {
            p.setXpTotal(p.getXpTotal() + challenge.getRewardXp());
            profileRepository.save(p);
        });

        addRankingScore(userId, challenge.getRewardXp());
    }

    @Override
    @Transactional(readOnly = true)
    public List<Reward> findAllRewards() {
        return rewardRepository.findAll();
    }

    @Override
    @Transactional
    public void useReward(UUID rewardId, UUID userId) {
        Reward reward = rewardRepository.findById(rewardId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Recompensa no encontrada"));
        profileRepository.findByUserId(userId).ifPresent(p -> {
            if (p.getXpTotal() < reward.getCostXp()) {
                throw new AppException(HttpStatus.BAD_REQUEST, "XP insuficiente");
            }
            p.setXpTotal(p.getXpTotal() - reward.getCostXp());
            profileRepository.save(p);
        });
    }

    @Override
    @Transactional(readOnly = true)
    public List<Ranking> getRanking() {
        String week = getCurrentWeekLabel();
        return rankingRepository.findByWeekLabelOrderByScoreDesc(week, PageRequest.of(0, 50));
    }

    @Override
    @Transactional
    public void updateRankingVisibility(UUID userId, boolean visible) {
        profileRepository.findByUserId(userId).ifPresent(p -> {
            p.setRankingVisible(visible);
            profileRepository.save(p);
        });
    }

    private void addRankingScore(UUID userId, int score) {
        String week = getCurrentWeekLabel();
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return;
        Ranking ranking = rankingRepository.findByUserIdAndWeekLabel(userId, week)
                .orElse(Ranking.builder().user(user).weekLabel(week).score(0).build());
        ranking.setScore(ranking.getScore() + score);
        rankingRepository.save(ranking);
    }

    private String getCurrentWeekLabel() {
        LocalDate now = LocalDate.now();
        int year = now.getYear();
        int week = now.get(IsoFields.WEEK_OF_WEEK_BASED_YEAR);
        return year + "-W" + String.format("%02d", week);
    }

    private ChallengeResponse toChallengeResponse(WeeklyChallenge c) {
        return ChallengeResponse.builder()
                .id(c.getId()).title(c.getTitle()).description(c.getDescription())
                .rewardXp(c.getRewardXp()).startDate(c.getStartDate()).endDate(c.getEndDate())
                .build();
    }
}
